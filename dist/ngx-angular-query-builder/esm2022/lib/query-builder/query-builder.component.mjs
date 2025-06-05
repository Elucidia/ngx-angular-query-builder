import { NG_VALUE_ACCESSOR, NG_VALIDATORS } from "@angular/forms";
import { QueryOperatorDirective } from "./query-operator.directive";
import { QueryFieldDirective } from "./query-field.directive";
import { QueryEntityDirective } from "./query-entity.directive";
import { QuerySwitchGroupDirective } from "./query-switch-group.directive";
import { QueryButtonGroupDirective } from "./query-button-group.directive";
import { QueryInputDirective } from "./query-input.directive";
import { QueryRemoveButtonDirective } from "./query-remove-button.directive";
import { QueryEmptyWarningDirective } from "./query-empty-warning.directive";
import { QueryArrowIconDirective } from "./query-arrow-icon.directive";
import { Component, ContentChild, ContentChildren, forwardRef, Input, ViewChild, HostBinding } from "@angular/core";
import * as i0 from "@angular/core";
import * as i1 from "@angular/common";
import * as i2 from "@angular/forms";
export const CONTROL_VALUE_ACCESSOR = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => QueryBuilderComponent),
    multi: true
};
export const VALIDATOR = {
    provide: NG_VALIDATORS,
    useExisting: forwardRef(() => QueryBuilderComponent),
    multi: true
};
export class QueryBuilderComponent {
    get condition() {
        return this.data?.condition;
    }
    constructor(changeDetectorRef) {
        this.changeDetectorRef = changeDetectorRef;
        this.defaultClassNames = {
            arrowIconButton: "q-arrow-icon-button",
            arrowIcon: "q-icon q-arrow-icon",
            removeIcon: "q-icon q-remove-icon",
            addIcon: "q-icon q-add-icon",
            button: "q-button",
            buttonGroup: "q-button-group",
            removeButton: "q-remove-button",
            switchGroup: "q-switch-group",
            switchLabel: "q-switch-label",
            switchRadio: "q-switch-radio",
            rightAlign: "q-right-align",
            transition: "q-transition",
            collapsed: "q-collapsed",
            treeContainer: "q-tree-container",
            tree: "q-tree",
            row: "q-row",
            connector: "q-connector",
            rule: "q-rule",
            ruleSet: "q-ruleset",
            invalidRuleSet: "q-invalid-ruleset",
            emptyWarning: "q-empty-warning",
            fieldControl: "q-field-control",
            fieldControlSize: "q-control-size",
            entityControl: "q-entity-control",
            entityControlSize: "q-control-size",
            operatorControl: "q-operator-control",
            operatorControlSize: "q-control-size",
            inputControl: "q-input-control",
            inputControlSize: "q-control-size"
        };
        this.defaultOperatorMap = {
            string: ["=", "!=", "contains", "like"],
            number: ["=", "!=", ">", ">=", "<", "<="],
            time: ["=", "!=", ">", ">=", "<", "<="],
            date: ["=", "!=", ">", ">=", "<", "<="],
            category: ["=", "!=", "in", "not in"],
            boolean: ["="]
        };
        this.disabled = false;
        this.data = { condition: "and", rules: [] };
        this.allowRuleset = true;
        this.allowCollapse = false;
        this.emptyMessage = "A ruleset cannot be empty. Please add a rule or remove it all together.";
        this.classNames = {};
        this.operatorMap = {};
        this.config = { fields: {} };
        this.persistValueOnFieldChange = false;
        this.defaultTemplateTypes = [
            "string",
            "number",
            "time",
            "date",
            "category",
            "boolean",
            "multiselect"
        ];
        this.defaultPersistValueTypes = ["string", "number", "time", "date", "boolean"];
        this.defaultEmptyList = [];
        this.operatorsCache = {};
        this.inputContextCache = new Map();
        this.operatorContextCache = new Map();
        this.fieldContextCache = new Map();
        this.entityContextCache = new Map();
        this.removeButtonContextCache = new Map();
        // ----------END----------
        this.getDisabledState = () => {
            return this.disabled;
        };
        this.fields = [];
        this.filterFields = [];
        this.entities = [];
    }
    // ----------OnChanges Implementation----------
    ngOnChanges(changes) {
        const config = this.config;
        const type = typeof config;
        if (type === "object") {
            this.fields = Object.keys(config.fields).map((value) => {
                const field = config.fields[value];
                field.value = field.value || value;
                return field;
            });
            if (config.entities) {
                this.entities = Object.keys(config.entities).map((value) => {
                    const entity = config.entities ? config.entities[value] : [];
                    entity.value = entity.value || value;
                    return entity;
                });
            }
            else {
                this.entities = [];
            }
            this.operatorsCache = {};
        }
        else {
            throw new Error(`Expected 'config' must be a valid object, got ${type} instead.`);
        }
    }
    // ----------Validator Implementation----------
    validate(control) {
        const errors = {};
        const ruleErrorStore = [];
        let hasErrors = false;
        if (!this.config.allowEmptyRulesets && this.checkEmptyRuleInRuleset(this.data)) {
            errors.empty = "Empty rulesets are not allowed.";
            hasErrors = true;
        }
        this.validateRulesInRuleset(this.data, ruleErrorStore);
        if (ruleErrorStore.length) {
            errors.rules = ruleErrorStore;
            hasErrors = true;
        }
        return hasErrors ? errors : null;
    }
    // ----------ControlValueAccessor Implementation----------
    get value() {
        return this.data;
    }
    set value(value) {
        // When component is initialized without a formControl, null is passed to value
        this.data = value || { condition: "and", rules: [] };
        this.handleDataChange();
    }
    writeValue(obj) {
        this.value = obj;
    }
    registerOnChange(fn) {
        this.onChangeCallback = () => fn(this.data);
    }
    registerOnTouched(fn) {
        this.onTouchedCallback = () => fn(this.data);
    }
    setDisabledState(isDisabled) {
        this.disabled = isDisabled;
        this.changeDetectorRef.detectChanges();
    }
    findTemplateForRule(rule) {
        const type = this.getInputType(rule.field, rule.operator);
        if (type) {
            const queryInput = this.findQueryInput(type);
            if (queryInput) {
                return queryInput.template;
            }
            else {
                if (this.defaultTemplateTypes.indexOf(type) === -1) {
                    console.warn(`Could not find template for field with type: ${type}`);
                }
                return null;
            }
        }
    }
    findQueryInput(type) {
        const templates = this.parentInputTemplates || this.inputTemplates || [];
        return templates.find((item) => item.queryInputType === type);
    }
    getOperators(field) {
        if (this.operatorsCache[field]) {
            return this.operatorsCache[field];
        }
        let operators = this.defaultEmptyList;
        const fieldObject = this.config.fields[field];
        if (this.config.getOperators) {
            return this.config.getOperators(field, fieldObject);
        }
        const type = fieldObject.type;
        if (fieldObject && fieldObject.operators) {
            operators = fieldObject.operators;
        }
        else if (type) {
            operators =
                (this.operatorMap && this.operatorMap[type]) ||
                    this.defaultOperatorMap[type] ||
                    this.defaultEmptyList;
            if (operators.length === 0) {
                console.warn(`No operators found for field '${field}' with type ${fieldObject.type}. ` +
                    `Please define an 'operators' property on the field or use the 'operatorMap' binding to fix this.`);
            }
            if (fieldObject.nullable) {
                operators = operators.concat(["is null", "is not null"]);
            }
        }
        else {
            console.warn(`No 'type' property found on field: '${field}'`);
        }
        // Cache reference to array object, so it won't be computed next time and trigger a rerender.
        this.operatorsCache[field] = operators;
        return operators;
    }
    getFields(entity) {
        if (this.entities?.length && entity) {
            return this.fields.filter((field) => {
                return field && field.entity === entity;
            });
        }
        else {
            return this.fields;
        }
    }
    getInputType(field, operator) {
        if (this.config.getInputType) {
            return this.config.getInputType(field, operator);
        }
        if (!this.config.fields[field]) {
            throw new Error(`No configuration for field '${field}' could be found! Please add it to config.fields.`);
        }
        const type = this.config.fields[field].type;
        switch (operator) {
            case "is null":
            case "is not null":
                return null; // No displayed component
            case "in":
            case "not in":
                return type === "category" || type === "boolean" ? "multiselect" : type;
            default:
                return type;
        }
    }
    getOptions(field) {
        if (this.config.getOptions) {
            return this.config.getOptions(field);
        }
        return this.config.fields[field].options || this.defaultEmptyList;
    }
    getClassNames(...args) {
        const clsLookup = this.classNames ? this.classNames : this.defaultClassNames;
        const defaultClassNames = this.defaultClassNames;
        const classNames = args
            .map((id) => clsLookup[id] || defaultClassNames[id])
            .filter((c) => !!c);
        return classNames.length ? classNames.join(" ") : [];
    }
    getDefaultField(entity) {
        if (!entity) {
            return null;
        }
        else if (entity.defaultField !== undefined) {
            return this.getDefaultValue(entity.defaultField);
        }
        else {
            const entityFields = this.fields.filter((field) => {
                return field && field.entity === entity.value;
            });
            if (entityFields && entityFields.length) {
                return entityFields[0];
            }
            else {
                console.warn(`No fields found for entity '${entity.name}'. ` +
                    `A 'defaultOperator' is also not specified on the field config. Operator value will default to null.`);
                return null;
            }
        }
    }
    getDefaultOperator(field) {
        if (field && field.defaultOperator !== undefined) {
            return this.getDefaultValue(field.defaultOperator);
        }
        else {
            const operators = this.getOperators(field.value);
            if (operators && operators.length) {
                return operators[0];
            }
            else {
                console.warn(`No operators found for field '${field.value}'. ` +
                    `A 'defaultOperator' is also not specified on the field config. Operator value will default to null.`);
                return null;
            }
        }
    }
    addRule(parent) {
        if (this.disabled) {
            return;
        }
        parent = parent || this.data;
        if (this.config.addRule) {
            this.config.addRule(parent);
        }
        else {
            const field = this.fields[0];
            parent.rules = parent.rules.concat([
                {
                    field: field.value,
                    operator: this.getDefaultOperator(field),
                    value: this.getDefaultValue(field.defaultValue),
                    entity: field.entity
                }
            ]);
        }
        this.handleTouched();
        this.handleDataChange();
    }
    removeRule(rule, parent) {
        if (this.disabled) {
            return;
        }
        parent = parent || this.data;
        if (this.config.removeRule) {
            this.config.removeRule(rule, parent);
        }
        else {
            parent.rules = parent.rules.filter((r) => r !== rule);
        }
        this.inputContextCache.delete(rule);
        this.operatorContextCache.delete(rule);
        this.fieldContextCache.delete(rule);
        this.entityContextCache.delete(rule);
        this.removeButtonContextCache.delete(rule);
        this.handleTouched();
        this.handleDataChange();
    }
    addRuleSet(parent) {
        if (this.disabled) {
            return;
        }
        parent = parent || this.data;
        if (this.config.addRuleSet) {
            this.config.addRuleSet(parent);
        }
        else {
            parent.rules = parent.rules.concat([{ condition: "and", rules: [] }]);
        }
        this.handleTouched();
        this.handleDataChange();
    }
    removeRuleSet(ruleset, parent) {
        if (this.disabled) {
            return;
        }
        ruleset = ruleset || this.data;
        parent = parent || this.parentValue;
        if (this.config.removeRuleSet) {
            this.config.removeRuleSet(ruleset, parent);
        }
        else if (parent) {
            parent.rules = parent.rules.filter((r) => r !== ruleset);
        }
        this.handleTouched();
        this.handleDataChange();
    }
    transitionEnd(e) {
        this.treeContainer.nativeElement.style.maxHeight = null;
    }
    toggleCollapse() {
        this.computedTreeContainerHeight();
        setTimeout(() => {
            this.data.collapsed = !this.data.collapsed;
        }, 100);
    }
    computedTreeContainerHeight() {
        const nativeElement = this.treeContainer.nativeElement;
        if (nativeElement && nativeElement.firstElementChild) {
            nativeElement.style.maxHeight = nativeElement.firstElementChild.clientHeight + 8 + "px";
        }
    }
    changeCondition(value) {
        if (this.disabled) {
            return;
        }
        this.data.condition = value;
        this.handleTouched();
        this.handleDataChange();
    }
    changeOperator(rule) {
        if (this.disabled) {
            return;
        }
        if (this.config.coerceValueForOperator) {
            rule.value = this.config.coerceValueForOperator(rule.operator, rule.value, rule);
        }
        else {
            rule.value = this.coerceValueForOperator(rule.operator, rule.value, rule);
        }
        this.handleTouched();
        this.handleDataChange();
    }
    coerceValueForOperator(operator, value, rule) {
        const inputType = this.getInputType(rule.field, operator);
        if (inputType === "multiselect" && !Array.isArray(value)) {
            return [value];
        }
        return value;
    }
    changeInput() {
        if (this.disabled) {
            return;
        }
        this.handleTouched();
        this.handleDataChange();
    }
    changeField(fieldValue, rule) {
        if (this.disabled) {
            return;
        }
        const inputContext = this.inputContextCache.get(rule);
        const currentField = inputContext && inputContext.field;
        const nextField = this.config.fields[fieldValue];
        const nextValue = this.calculateFieldChangeValue(currentField, nextField, rule.value);
        if (nextValue !== undefined) {
            rule.value = nextValue;
        }
        else {
            delete rule.value;
        }
        rule.operator = this.getDefaultOperator(nextField);
        // Create new context objects so templates will automatically update
        this.inputContextCache.delete(rule);
        this.operatorContextCache.delete(rule);
        this.fieldContextCache.delete(rule);
        this.entityContextCache.delete(rule);
        this.getInputContext(rule);
        this.getFieldContext(rule);
        this.getOperatorContext(rule);
        this.getEntityContext(rule);
        this.handleTouched();
        this.handleDataChange();
    }
    changeEntity(entityValue, rule, index, data) {
        if (this.disabled) {
            return;
        }
        let i = index;
        let rs = data;
        const entity = this.entities.find((e) => e.value === entityValue);
        const defaultField = this.getDefaultField(entity);
        if (!rs) {
            rs = this.data;
            i = rs.rules.findIndex((x) => x === rule);
        }
        rule.field = defaultField.value;
        rs.rules[i] = rule;
        if (defaultField) {
            this.changeField(defaultField.value, rule);
        }
        else {
            this.handleTouched();
            this.handleDataChange();
        }
    }
    getDefaultValue(defaultValue) {
        switch (typeof defaultValue) {
            case "function":
                return defaultValue();
            default:
                return defaultValue;
        }
    }
    getOperatorTemplate() {
        const t = this.parentOperatorTemplate || this.operatorTemplate;
        return t ? t.template : null;
    }
    getFieldTemplate() {
        const t = this.parentFieldTemplate || this.fieldTemplate;
        return t ? t.template : null;
    }
    getEntityTemplate() {
        const t = this.parentEntityTemplate || this.entityTemplate;
        return t ? t.template : null;
    }
    getArrowIconTemplate() {
        const t = this.parentArrowIconTemplate || this.arrowIconTemplate;
        return t ? t.template : null;
    }
    getButtonGroupTemplate() {
        const t = this.parentButtonGroupTemplate || this.buttonGroupTemplate;
        return t ? t.template : null;
    }
    getSwitchGroupTemplate() {
        const t = this.parentSwitchGroupTemplate || this.switchGroupTemplate;
        return t ? t.template : null;
    }
    getRemoveButtonTemplate() {
        const t = this.parentRemoveButtonTemplate || this.removeButtonTemplate;
        return t ? t.template : null;
    }
    getEmptyWarningTemplate() {
        const t = this.parentEmptyWarningTemplate || this.emptyWarningTemplate;
        return t ? t.template : null;
    }
    getQueryItemClassName(local) {
        let cls = this.getClassNames("row", "connector", "transition");
        cls += " " + this.getClassNames(local.ruleset ? "ruleSet" : "rule");
        if (local.invalid) {
            cls += " " + this.getClassNames("invalidRuleSet");
        }
        return cls;
    }
    getButtonGroupContext() {
        if (!this.buttonGroupContext) {
            this.buttonGroupContext = {
                addRule: this.addRule.bind(this),
                addRuleSet: this.allowRuleset && this.addRuleSet.bind(this),
                removeRuleSet: this.allowRuleset && this.parentValue && this.removeRuleSet.bind(this),
                getDisabledState: this.getDisabledState,
                $implicit: this.data
            };
        }
        return this.buttonGroupContext;
    }
    getRemoveButtonContext(rule) {
        if (!this.removeButtonContextCache.has(rule)) {
            this.removeButtonContextCache.set(rule, {
                removeRule: this.removeRule.bind(this),
                getDisabledState: this.getDisabledState,
                $implicit: rule
            });
        }
        return this.removeButtonContextCache.get(rule);
    }
    getFieldContext(rule) {
        if (!this.fieldContextCache.has(rule)) {
            this.fieldContextCache.set(rule, {
                onChange: this.changeField.bind(this),
                getFields: this.getFields.bind(this),
                getDisabledState: this.getDisabledState,
                fields: this.fields,
                $implicit: rule
            });
        }
        return this.fieldContextCache.get(rule);
    }
    getEntityContext(rule) {
        if (!this.entityContextCache.has(rule)) {
            this.entityContextCache.set(rule, {
                onChange: this.changeEntity.bind(this),
                getDisabledState: this.getDisabledState,
                entities: this.entities,
                $implicit: rule
            });
        }
        return this.entityContextCache.get(rule);
    }
    getSwitchGroupContext() {
        return {
            onChange: this.changeCondition.bind(this),
            getDisabledState: this.getDisabledState,
            $implicit: this.data
        };
    }
    getArrowIconContext() {
        return {
            getDisabledState: this.getDisabledState,
            $implicit: this.data
        };
    }
    getEmptyWarningContext() {
        return {
            getDisabledState: this.getDisabledState,
            message: this.emptyMessage,
            $implicit: this.data
        };
    }
    getOperatorContext(rule) {
        if (!this.operatorContextCache.has(rule)) {
            this.operatorContextCache.set(rule, {
                onChange: this.changeOperator.bind(this),
                getDisabledState: this.getDisabledState,
                operators: this.getOperators(rule.field),
                $implicit: rule
            });
        }
        return this.operatorContextCache.get(rule);
    }
    getInputContext(rule) {
        if (!this.inputContextCache.has(rule)) {
            this.inputContextCache.set(rule, {
                onChange: this.changeInput.bind(this),
                getDisabledState: this.getDisabledState,
                options: this.getOptions(rule.field),
                field: this.config.fields[rule.field],
                $implicit: rule
            });
        }
        return this.inputContextCache.get(rule);
    }
    calculateFieldChangeValue(currentField, nextField, currentValue) {
        if (this.config.calculateFieldChangeValue != null) {
            return this.config.calculateFieldChangeValue(currentField, nextField, currentValue);
        }
        const canKeepValue = () => {
            if (currentField == null || nextField == null) {
                return false;
            }
            return (currentField.type === nextField.type &&
                this.defaultPersistValueTypes.indexOf(currentField.type) !== -1);
        };
        if (this.persistValueOnFieldChange && canKeepValue()) {
            return currentValue;
        }
        if (nextField && nextField.defaultValue !== undefined) {
            return this.getDefaultValue(nextField.defaultValue);
        }
        return undefined;
    }
    checkEmptyRuleInRuleset(ruleset) {
        if (!ruleset || !ruleset.rules || ruleset.rules.length === 0) {
            return true;
        }
        else {
            return ruleset.rules.some((item) => {
                if (item.rules) {
                    return this.checkEmptyRuleInRuleset(item);
                }
                else {
                    return false;
                }
            });
        }
    }
    validateRulesInRuleset(ruleset, errorStore) {
        if (ruleset && ruleset.rules && ruleset.rules.length > 0) {
            ruleset.rules.forEach((item) => {
                if (item.rules) {
                    return this.validateRulesInRuleset(item, errorStore);
                }
                else if (item.field) {
                    const field = this.config.fields[item.field];
                    if (field && field.validator) {
                        const error = field.validator(item, ruleset);
                        if (error != null) {
                            errorStore.push(error);
                        }
                    }
                }
            });
        }
    }
    handleDataChange() {
        this.changeDetectorRef.markForCheck();
        if (this.onChangeCallback) {
            this.onChangeCallback();
        }
        if (this.parentChangeCallback) {
            this.parentChangeCallback();
        }
    }
    handleTouched() {
        if (this.onTouchedCallback) {
            this.onTouchedCallback();
        }
        if (this.parentTouchedCallback) {
            this.parentTouchedCallback();
        }
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.0.3", ngImport: i0, type: QueryBuilderComponent, deps: [{ token: i0.ChangeDetectorRef }], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "18.0.3", type: QueryBuilderComponent, selector: "query-builder", inputs: { disabled: "disabled", data: "data", allowRuleset: "allowRuleset", allowCollapse: "allowCollapse", emptyMessage: "emptyMessage", classNames: "classNames", operatorMap: "operatorMap", parentValue: "parentValue", config: "config", parentArrowIconTemplate: "parentArrowIconTemplate", parentInputTemplates: "parentInputTemplates", parentOperatorTemplate: "parentOperatorTemplate", parentFieldTemplate: "parentFieldTemplate", parentEntityTemplate: "parentEntityTemplate", parentSwitchGroupTemplate: "parentSwitchGroupTemplate", parentButtonGroupTemplate: "parentButtonGroupTemplate", parentRemoveButtonTemplate: "parentRemoveButtonTemplate", parentEmptyWarningTemplate: "parentEmptyWarningTemplate", parentChangeCallback: "parentChangeCallback", parentTouchedCallback: "parentTouchedCallback", persistValueOnFieldChange: "persistValueOnFieldChange", value: "value" }, host: { properties: { "attr.query-builder-condition": "this.condition" } }, providers: [CONTROL_VALUE_ACCESSOR, VALIDATOR], queries: [{ propertyName: "buttonGroupTemplate", first: true, predicate: QueryButtonGroupDirective, descendants: true }, { propertyName: "switchGroupTemplate", first: true, predicate: QuerySwitchGroupDirective, descendants: true }, { propertyName: "fieldTemplate", first: true, predicate: QueryFieldDirective, descendants: true }, { propertyName: "entityTemplate", first: true, predicate: QueryEntityDirective, descendants: true }, { propertyName: "operatorTemplate", first: true, predicate: QueryOperatorDirective, descendants: true }, { propertyName: "removeButtonTemplate", first: true, predicate: QueryRemoveButtonDirective, descendants: true }, { propertyName: "emptyWarningTemplate", first: true, predicate: QueryEmptyWarningDirective, descendants: true }, { propertyName: "arrowIconTemplate", first: true, predicate: QueryArrowIconDirective, descendants: true }, { propertyName: "inputTemplates", predicate: QueryInputDirective, descendants: true }], viewQueries: [{ propertyName: "treeContainer", first: true, predicate: ["treeContainer"], descendants: true, static: true }], usesOnChanges: true, ngImport: i0, template: "<div [ngClass]=\"getClassNames('switchRow')\">\n  <ng-template #defaultArrowIcon>\n    <i [ngClass]=\"getClassNames('arrowIcon')\"></i>\n  </ng-template>\n\n  <a\n    *ngIf=\"allowCollapse\"\n    (click)=\"toggleCollapse()\"\n    [ngClass]=\"getClassNames('arrowIconButton', data.collapsed ? 'collapsed' : '')\"\n  >\n    <ng-container *ngIf=\"getArrowIconTemplate() as template; else defaultArrowIcon\">\n      <ng-container *ngTemplateOutlet=\"template; context: getArrowIconContext()\"></ng-container>\n    </ng-container>\n  </a>\n\n  <ng-container *ngIf=\"getButtonGroupTemplate() as template; else defaultButtonGroup\">\n    <div [ngClass]=\"getClassNames('buttonGroup', 'rightAlign')\">\n      <ng-container *ngTemplateOutlet=\"template; context: getButtonGroupContext()\"></ng-container>\n    </div>\n  </ng-container>\n\n  <ng-template #defaultButtonGroup>\n    <div [ngClass]=\"getClassNames('buttonGroup', 'rightAlign')\">\n      <button\n        type=\"button\"\n        (click)=\"addRule()\"\n        [ngClass]=\"getClassNames('button')\"\n        [disabled]=\"disabled\"\n      >\n        <i [ngClass]=\"getClassNames('addIcon')\"></i> Rule\n      </button>\n      <button\n        type=\"button\"\n        (click)=\"addRuleSet()\"\n        [ngClass]=\"getClassNames('button')\"\n        *ngIf=\"allowRuleset\"\n        [disabled]=\"disabled\"\n      >\n        <i [ngClass]=\"getClassNames('addIcon')\"></i> Ruleset\n      </button>\n      <ng-container *ngIf=\"!!parentValue && allowRuleset\">\n        <button\n          type=\"button\"\n          (click)=\"removeRuleSet()\"\n          [ngClass]=\"getClassNames('button', 'removeButton')\"\n          [disabled]=\"disabled\"\n        >\n          <i [ngClass]=\"getClassNames('removeIcon')\"></i>\n        </button>\n      </ng-container>\n    </div>\n  </ng-template>\n\n  <ng-container *ngIf=\"getSwitchGroupTemplate() as template; else defaultSwitchGroup\">\n    <ng-container *ngTemplateOutlet=\"template; context: getSwitchGroupContext()\"></ng-container>\n  </ng-container>\n\n  <ng-template #defaultSwitchGroup>\n    <div [ngClass]=\"getClassNames('switchGroup', 'transition')\" *ngIf=\"data\">\n      <div [ngClass]=\"getClassNames('switchControl')\">\n        <input\n          type=\"radio\"\n          [ngClass]=\"getClassNames('switchRadio')\"\n          [(ngModel)]=\"data.condition\"\n          [disabled]=\"disabled\"\n          value=\"and\"\n          #andOption\n        />\n        <label (click)=\"changeCondition(andOption.value)\" [ngClass]=\"getClassNames('switchLabel')\"\n          >AND</label\n        >\n      </div>\n      <div [ngClass]=\"getClassNames('switchControl')\">\n        <input\n          type=\"radio\"\n          [ngClass]=\"getClassNames('switchRadio')\"\n          [(ngModel)]=\"data.condition\"\n          [disabled]=\"disabled\"\n          value=\"or\"\n          #orOption\n        />\n        <label (click)=\"changeCondition(orOption.value)\" [ngClass]=\"getClassNames('switchLabel')\"\n          >OR</label\n        >\n      </div>\n    </div>\n  </ng-template>\n</div>\n\n<div\n  #treeContainer\n  (transitionend)=\"transitionEnd($event)\"\n  [ngClass]=\"getClassNames('treeContainer', data.collapsed ? 'collapsed' : '')\"\n>\n  <ul [ngClass]=\"getClassNames('tree')\" *ngIf=\"data && data.rules\">\n    <ng-container *ngFor=\"let rule of data.rules; let i = index\">\n      <ng-container\n        *ngIf=\"{\n          ruleset: !!rule.rules,\n          invalid: !config.allowEmptyRulesets && rule.rules && rule.rules.length === 0\n        } as local\"\n      >\n        <li [ngClass]=\"getQueryItemClassName(local)\">\n          <ng-container *ngIf=\"!local.ruleset\">\n            <ng-container *ngIf=\"getRemoveButtonTemplate() as template; else defaultRemoveButton\">\n              <div [ngClass]=\"getClassNames('buttonGroup', 'rightAlign')\">\n                <ng-container\n                  *ngTemplateOutlet=\"template; context: getRemoveButtonContext(rule)\"\n                ></ng-container>\n              </div>\n            </ng-container>\n\n            <ng-template #defaultRemoveButton>\n              <div [ngClass]=\"getClassNames('removeButtonSize', 'rightAlign')\">\n                <button\n                  type=\"button\"\n                  [ngClass]=\"getClassNames('button', 'removeButton')\"\n                  (click)=\"removeRule(rule, data)\"\n                  [disabled]=\"disabled\"\n                >\n                  <i [ngClass]=\"getClassNames('removeIcon')\"></i>\n                </button>\n              </div>\n            </ng-template>\n\n            <div *ngIf=\"entities?.length\" class=\"q-inline-block-display\">\n              <ng-container *ngIf=\"getEntityTemplate() as template; else defaultEntity\">\n                <ng-container\n                  *ngTemplateOutlet=\"template; context: getEntityContext(rule)\"\n                ></ng-container>\n              </ng-container>\n            </div>\n\n            <ng-template #defaultEntity>\n              <div [ngClass]=\"getClassNames('entityControlSize')\">\n                <select\n                  [ngClass]=\"getClassNames('entityControl')\"\n                  [(ngModel)]=\"rule.entity\"\n                  (ngModelChange)=\"changeEntity($event, rule, i, data)\"\n                  [disabled]=\"disabled\"\n                >\n                  <option *ngFor=\"let entity of entities\" [ngValue]=\"entity.value\">\n                    {{ entity.name }}\n                  </option>\n                </select>\n              </div>\n            </ng-template>\n\n            <ng-container *ngIf=\"getFieldTemplate() as template; else defaultField\">\n              <ng-container\n                *ngTemplateOutlet=\"template; context: getFieldContext(rule)\"\n              ></ng-container>\n            </ng-container>\n\n            <ng-template #defaultField>\n              <div [ngClass]=\"getClassNames('fieldControlSize')\">\n                <select\n                  [ngClass]=\"getClassNames('fieldControl')\"\n                  [(ngModel)]=\"rule.field\"\n                  (ngModelChange)=\"changeField($event, rule)\"\n                  [disabled]=\"disabled\"\n                >\n                  <option *ngFor=\"let field of getFields(rule.entity)\" [ngValue]=\"field.value\">\n                    {{ field.name }}\n                  </option>\n                </select>\n              </div>\n            </ng-template>\n\n            <ng-container *ngIf=\"getOperatorTemplate() as template; else defaultOperator\">\n              <ng-container\n                *ngTemplateOutlet=\"template; context: getOperatorContext(rule)\"\n              ></ng-container>\n            </ng-container>\n\n            <ng-template #defaultOperator>\n              <div [ngClass]=\"getClassNames('operatorControlSize')\">\n                <select\n                  [ngClass]=\"getClassNames('operatorControl')\"\n                  [(ngModel)]=\"rule.operator\"\n                  (ngModelChange)=\"changeOperator(rule)\"\n                  [disabled]=\"disabled\"\n                >\n                  <option *ngFor=\"let operator of getOperators(rule.field)\" [ngValue]=\"operator\">\n                    {{ operator }}\n                  </option>\n                </select>\n              </div>\n            </ng-template>\n\n            <ng-container *ngIf=\"findTemplateForRule(rule) as template; else defaultInput\">\n              <ng-container\n                *ngTemplateOutlet=\"template; context: getInputContext(rule)\"\n              ></ng-container>\n            </ng-container>\n\n            <ng-template #defaultInput>\n              <div\n                [ngClass]=\"getClassNames('inputControlSize')\"\n                [ngSwitch]=\"getInputType(rule.field, rule.operator)\"\n              >\n                <input\n                  [ngClass]=\"getClassNames('inputControl')\"\n                  [(ngModel)]=\"rule.value\"\n                  (ngModelChange)=\"changeInput()\"\n                  [disabled]=\"disabled\"\n                  *ngSwitchCase=\"'string'\"\n                  type=\"text\"\n                />\n                <input\n                  [ngClass]=\"getClassNames('inputControl')\"\n                  [(ngModel)]=\"rule.value\"\n                  (ngModelChange)=\"changeInput()\"\n                  [disabled]=\"disabled\"\n                  *ngSwitchCase=\"'number'\"\n                  type=\"number\"\n                />\n                <input\n                  [ngClass]=\"getClassNames('inputControl')\"\n                  [(ngModel)]=\"rule.value\"\n                  (ngModelChange)=\"changeInput()\"\n                  [disabled]=\"disabled\"\n                  *ngSwitchCase=\"'date'\"\n                  type=\"date\"\n                />\n                <input\n                  [ngClass]=\"getClassNames('inputControl')\"\n                  [(ngModel)]=\"rule.value\"\n                  (ngModelChange)=\"changeInput()\"\n                  [disabled]=\"disabled\"\n                  *ngSwitchCase=\"'time'\"\n                  type=\"time\"\n                />\n                <select\n                  [ngClass]=\"getClassNames('inputControl')\"\n                  [(ngModel)]=\"rule.value\"\n                  (ngModelChange)=\"changeInput()\"\n                  [disabled]=\"disabled\"\n                  *ngSwitchCase=\"'category'\"\n                >\n                  <option *ngFor=\"let opt of getOptions(rule.field)\" [ngValue]=\"opt.value\">\n                    {{ opt.name }}\n                  </option>\n                </select>\n                <ng-container *ngSwitchCase=\"'multiselect'\">\n                  <select\n                    [ngClass]=\"getClassNames('inputControl')\"\n                    [(ngModel)]=\"rule.value\"\n                    (ngModelChange)=\"changeInput()\"\n                    [disabled]=\"disabled\"\n                    multiple\n                  >\n                    <option *ngFor=\"let opt of getOptions(rule.field)\" [ngValue]=\"opt.value\">\n                      {{ opt.name }}\n                    </option>\n                  </select>\n                </ng-container>\n                <input\n                  [ngClass]=\"getClassNames('inputControl')\"\n                  [(ngModel)]=\"rule.value\"\n                  (ngModelChange)=\"changeInput()\"\n                  [disabled]=\"disabled\"\n                  *ngSwitchCase=\"'boolean'\"\n                  type=\"checkbox\"\n                />\n              </div>\n            </ng-template>\n          </ng-container>\n          <query-builder\n            *ngIf=\"local.ruleset\"\n            [data]=\"rule\"\n            [disabled]=\"disabled\"\n            [parentTouchedCallback]=\"parentTouchedCallback || onTouchedCallback\"\n            [parentChangeCallback]=\"parentChangeCallback || onChangeCallback\"\n            [parentInputTemplates]=\"parentInputTemplates || inputTemplates\"\n            [parentOperatorTemplate]=\"parentOperatorTemplate || operatorTemplate\"\n            [parentFieldTemplate]=\"parentFieldTemplate || fieldTemplate\"\n            [parentEntityTemplate]=\"parentEntityTemplate || entityTemplate\"\n            [parentSwitchGroupTemplate]=\"parentSwitchGroupTemplate || switchGroupTemplate\"\n            [parentButtonGroupTemplate]=\"parentButtonGroupTemplate || buttonGroupTemplate\"\n            [parentRemoveButtonTemplate]=\"parentRemoveButtonTemplate || removeButtonTemplate\"\n            [parentEmptyWarningTemplate]=\"parentEmptyWarningTemplate || emptyWarningTemplate\"\n            [parentArrowIconTemplate]=\"parentArrowIconTemplate || arrowIconTemplate\"\n            [parentValue]=\"data\"\n            [classNames]=\"classNames\"\n            [config]=\"config\"\n            [allowRuleset]=\"allowRuleset\"\n            [allowCollapse]=\"allowCollapse\"\n            [emptyMessage]=\"emptyMessage\"\n            [operatorMap]=\"operatorMap\"\n          >\n          </query-builder>\n\n          <ng-container *ngIf=\"getEmptyWarningTemplate() as template; else defaultEmptyWarning\">\n            <ng-container *ngIf=\"local.invalid\">\n              <ng-container\n                *ngTemplateOutlet=\"template; context: getEmptyWarningContext()\"\n              ></ng-container>\n            </ng-container>\n          </ng-container>\n\n          <ng-template #defaultEmptyWarning>\n            <p [ngClass]=\"getClassNames('emptyWarning')\" *ngIf=\"local.invalid\">\n              {{ emptyMessage }}\n            </p>\n          </ng-template>\n        </li>\n      </ng-container>\n    </ng-container>\n  </ul>\n</div>\n", styles: ["@charset \"UTF-8\";:host{display:block;width:100%}:host .q-icon{font-style:normal;font-size:12px}:host .q-remove-icon:before{content:\"\\274c\"}:host .q-arrow-icon-button{float:left;margin:4px 6px 4px 0;transform:rotate(90deg);transition:linear .25s transform;cursor:pointer}:host .q-arrow-icon-button.q-collapsed{transform:rotate(0)}:host .q-arrow-icon:before{content:\"\\25b6\"}:host .q-add-icon{color:#555}:host .q-add-icon:before{content:\"\\2795\"}:host .q-remove-button{color:#b3415d;width:31px}:host .q-switch-group,:host .q-button-group{font-family:Lucida Grande,Tahoma,Verdana,sans-serif;overflow:hidden}:host .q-right-align{float:right}:host .q-button{margin-left:8px;padding:0 8px;background-color:#fff}:host .q-button:disabled{display:none}:host .q-control-size{display:inline-block;vertical-align:top;padding-right:10px}:host .q-input-control,:host .q-operator-control,:host .q-field-control,:host .q-entity-control{display:inline-block;padding:5px 8px;color:#555;background-color:#fff;background-image:none;border:1px solid #ccc;border-radius:4px;box-sizing:border-box;width:auto;min-width:180px}:host .q-input-control:disabled,:host .q-operator-control:disabled,:host .q-field-control:disabled,:host .q-entity-control:disabled{border-color:transparent}:host .q-operator-control,:host .q-field-control,:host .q-entity-control,:host .q-input-control:not([type=checkbox]){min-height:32px;-webkit-appearance:none}:host .q-switch-label,:host .q-button{float:left;margin-bottom:0;font-size:14px;line-height:30px;font-weight:400;text-align:center;text-shadow:none;border:1px solid rgba(0,0,0,.2);box-sizing:border-box}:host .q-switch-label:hover,:host .q-button:hover{cursor:pointer;background-color:#f0f0f0}:host .q-switch-label{background-color:#e4e4e4;padding:0 8px}:host .q-switch-radio{position:absolute;clip:rect(0,0,0,0);height:1px;width:1px;border:0;overflow:hidden}:host .q-switch-radio:checked+.q-switch-label{border:1px solid rgb(97,158,215);background:#fff;color:#3176b3}:host .q-switch-radio:disabled+.q-switch-label{display:none}:host .q-switch-radio:checked:disabled+.q-switch-label{display:initial;color:initial;cursor:default;border-color:transparent}:host .q-invalid-ruleset{border:1px solid rgba(179,65,93,.5)!important;background:#b3415d1a!important}:host .q-empty-warning{color:#8d252e;text-align:center}:host .q-ruleset{border:1px solid #ccc}:host .q-rule{border:1px solid #ccc;background:#fff}:host .q-transition{-webkit-transition:all .1s ease-in-out;-moz-transition:all .1s ease-in-out;-ms-transition:all .1s ease-in-out;-o-transition:all .1s ease-in-out;transition:all .1s ease-in-out}:host .q-tree-container{width:100%;overflow:hidden;transition:ease-in .25s max-height}:host .q-tree-container.q-collapsed{max-height:0!important}:host .q-tree{list-style:none;margin:4px 0 2px}:host .q-row{padding:6px 8px;margin-top:6px}:host .q-connector{position:relative}:host .q-connector:before{top:-5px;border-width:0 0 2px 2px}:host .q-connector:after{border-width:0 0 0 2px;top:50%}:host .q-connector:before,:host .q-connector:after{content:\"\";left:-12px;border-color:#ccc;border-style:solid;width:9px;height:calc(50% + 6px);position:absolute}:host .q-connector:last-child:after{content:none}:host .q-inline-block-display{display:inline-block;vertical-align:top}\n"], dependencies: [{ kind: "directive", type: i1.NgClass, selector: "[ngClass]", inputs: ["class", "ngClass"] }, { kind: "directive", type: i1.NgForOf, selector: "[ngFor][ngForOf]", inputs: ["ngForOf", "ngForTrackBy", "ngForTemplate"] }, { kind: "directive", type: i1.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { kind: "directive", type: i1.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet", "ngTemplateOutletInjector"] }, { kind: "directive", type: i1.NgSwitch, selector: "[ngSwitch]", inputs: ["ngSwitch"] }, { kind: "directive", type: i1.NgSwitchCase, selector: "[ngSwitchCase]", inputs: ["ngSwitchCase"] }, { kind: "directive", type: i2.NgSelectOption, selector: "option", inputs: ["ngValue", "value"] }, { kind: "directive", type: i2.ɵNgSelectMultipleOption, selector: "option", inputs: ["ngValue", "value"] }, { kind: "directive", type: i2.DefaultValueAccessor, selector: "input:not([type=checkbox])[formControlName],textarea[formControlName],input:not([type=checkbox])[formControl],textarea[formControl],input:not([type=checkbox])[ngModel],textarea[ngModel],[ngDefaultControl]" }, { kind: "directive", type: i2.NumberValueAccessor, selector: "input[type=number][formControlName],input[type=number][formControl],input[type=number][ngModel]" }, { kind: "directive", type: i2.CheckboxControlValueAccessor, selector: "input[type=checkbox][formControlName],input[type=checkbox][formControl],input[type=checkbox][ngModel]" }, { kind: "directive", type: i2.SelectControlValueAccessor, selector: "select:not([multiple])[formControlName],select:not([multiple])[formControl],select:not([multiple])[ngModel]", inputs: ["compareWith"] }, { kind: "directive", type: i2.SelectMultipleControlValueAccessor, selector: "select[multiple][formControlName],select[multiple][formControl],select[multiple][ngModel]", inputs: ["compareWith"] }, { kind: "directive", type: i2.RadioControlValueAccessor, selector: "input[type=radio][formControlName],input[type=radio][formControl],input[type=radio][ngModel]", inputs: ["name", "formControlName", "value"] }, { kind: "directive", type: i2.NgControlStatus, selector: "[formControlName],[ngModel],[formControl]" }, { kind: "directive", type: i2.NgModel, selector: "[ngModel]:not([formControlName]):not([formControl])", inputs: ["name", "disabled", "ngModel", "ngModelOptions"], outputs: ["ngModelChange"], exportAs: ["ngModel"] }, { kind: "component", type: QueryBuilderComponent, selector: "query-builder", inputs: ["disabled", "data", "allowRuleset", "allowCollapse", "emptyMessage", "classNames", "operatorMap", "parentValue", "config", "parentArrowIconTemplate", "parentInputTemplates", "parentOperatorTemplate", "parentFieldTemplate", "parentEntityTemplate", "parentSwitchGroupTemplate", "parentButtonGroupTemplate", "parentRemoveButtonTemplate", "parentEmptyWarningTemplate", "parentChangeCallback", "parentTouchedCallback", "persistValueOnFieldChange", "value"] }] }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.0.3", ngImport: i0, type: QueryBuilderComponent, decorators: [{
            type: Component,
            args: [{ selector: "query-builder", providers: [CONTROL_VALUE_ACCESSOR, VALIDATOR], template: "<div [ngClass]=\"getClassNames('switchRow')\">\n  <ng-template #defaultArrowIcon>\n    <i [ngClass]=\"getClassNames('arrowIcon')\"></i>\n  </ng-template>\n\n  <a\n    *ngIf=\"allowCollapse\"\n    (click)=\"toggleCollapse()\"\n    [ngClass]=\"getClassNames('arrowIconButton', data.collapsed ? 'collapsed' : '')\"\n  >\n    <ng-container *ngIf=\"getArrowIconTemplate() as template; else defaultArrowIcon\">\n      <ng-container *ngTemplateOutlet=\"template; context: getArrowIconContext()\"></ng-container>\n    </ng-container>\n  </a>\n\n  <ng-container *ngIf=\"getButtonGroupTemplate() as template; else defaultButtonGroup\">\n    <div [ngClass]=\"getClassNames('buttonGroup', 'rightAlign')\">\n      <ng-container *ngTemplateOutlet=\"template; context: getButtonGroupContext()\"></ng-container>\n    </div>\n  </ng-container>\n\n  <ng-template #defaultButtonGroup>\n    <div [ngClass]=\"getClassNames('buttonGroup', 'rightAlign')\">\n      <button\n        type=\"button\"\n        (click)=\"addRule()\"\n        [ngClass]=\"getClassNames('button')\"\n        [disabled]=\"disabled\"\n      >\n        <i [ngClass]=\"getClassNames('addIcon')\"></i> Rule\n      </button>\n      <button\n        type=\"button\"\n        (click)=\"addRuleSet()\"\n        [ngClass]=\"getClassNames('button')\"\n        *ngIf=\"allowRuleset\"\n        [disabled]=\"disabled\"\n      >\n        <i [ngClass]=\"getClassNames('addIcon')\"></i> Ruleset\n      </button>\n      <ng-container *ngIf=\"!!parentValue && allowRuleset\">\n        <button\n          type=\"button\"\n          (click)=\"removeRuleSet()\"\n          [ngClass]=\"getClassNames('button', 'removeButton')\"\n          [disabled]=\"disabled\"\n        >\n          <i [ngClass]=\"getClassNames('removeIcon')\"></i>\n        </button>\n      </ng-container>\n    </div>\n  </ng-template>\n\n  <ng-container *ngIf=\"getSwitchGroupTemplate() as template; else defaultSwitchGroup\">\n    <ng-container *ngTemplateOutlet=\"template; context: getSwitchGroupContext()\"></ng-container>\n  </ng-container>\n\n  <ng-template #defaultSwitchGroup>\n    <div [ngClass]=\"getClassNames('switchGroup', 'transition')\" *ngIf=\"data\">\n      <div [ngClass]=\"getClassNames('switchControl')\">\n        <input\n          type=\"radio\"\n          [ngClass]=\"getClassNames('switchRadio')\"\n          [(ngModel)]=\"data.condition\"\n          [disabled]=\"disabled\"\n          value=\"and\"\n          #andOption\n        />\n        <label (click)=\"changeCondition(andOption.value)\" [ngClass]=\"getClassNames('switchLabel')\"\n          >AND</label\n        >\n      </div>\n      <div [ngClass]=\"getClassNames('switchControl')\">\n        <input\n          type=\"radio\"\n          [ngClass]=\"getClassNames('switchRadio')\"\n          [(ngModel)]=\"data.condition\"\n          [disabled]=\"disabled\"\n          value=\"or\"\n          #orOption\n        />\n        <label (click)=\"changeCondition(orOption.value)\" [ngClass]=\"getClassNames('switchLabel')\"\n          >OR</label\n        >\n      </div>\n    </div>\n  </ng-template>\n</div>\n\n<div\n  #treeContainer\n  (transitionend)=\"transitionEnd($event)\"\n  [ngClass]=\"getClassNames('treeContainer', data.collapsed ? 'collapsed' : '')\"\n>\n  <ul [ngClass]=\"getClassNames('tree')\" *ngIf=\"data && data.rules\">\n    <ng-container *ngFor=\"let rule of data.rules; let i = index\">\n      <ng-container\n        *ngIf=\"{\n          ruleset: !!rule.rules,\n          invalid: !config.allowEmptyRulesets && rule.rules && rule.rules.length === 0\n        } as local\"\n      >\n        <li [ngClass]=\"getQueryItemClassName(local)\">\n          <ng-container *ngIf=\"!local.ruleset\">\n            <ng-container *ngIf=\"getRemoveButtonTemplate() as template; else defaultRemoveButton\">\n              <div [ngClass]=\"getClassNames('buttonGroup', 'rightAlign')\">\n                <ng-container\n                  *ngTemplateOutlet=\"template; context: getRemoveButtonContext(rule)\"\n                ></ng-container>\n              </div>\n            </ng-container>\n\n            <ng-template #defaultRemoveButton>\n              <div [ngClass]=\"getClassNames('removeButtonSize', 'rightAlign')\">\n                <button\n                  type=\"button\"\n                  [ngClass]=\"getClassNames('button', 'removeButton')\"\n                  (click)=\"removeRule(rule, data)\"\n                  [disabled]=\"disabled\"\n                >\n                  <i [ngClass]=\"getClassNames('removeIcon')\"></i>\n                </button>\n              </div>\n            </ng-template>\n\n            <div *ngIf=\"entities?.length\" class=\"q-inline-block-display\">\n              <ng-container *ngIf=\"getEntityTemplate() as template; else defaultEntity\">\n                <ng-container\n                  *ngTemplateOutlet=\"template; context: getEntityContext(rule)\"\n                ></ng-container>\n              </ng-container>\n            </div>\n\n            <ng-template #defaultEntity>\n              <div [ngClass]=\"getClassNames('entityControlSize')\">\n                <select\n                  [ngClass]=\"getClassNames('entityControl')\"\n                  [(ngModel)]=\"rule.entity\"\n                  (ngModelChange)=\"changeEntity($event, rule, i, data)\"\n                  [disabled]=\"disabled\"\n                >\n                  <option *ngFor=\"let entity of entities\" [ngValue]=\"entity.value\">\n                    {{ entity.name }}\n                  </option>\n                </select>\n              </div>\n            </ng-template>\n\n            <ng-container *ngIf=\"getFieldTemplate() as template; else defaultField\">\n              <ng-container\n                *ngTemplateOutlet=\"template; context: getFieldContext(rule)\"\n              ></ng-container>\n            </ng-container>\n\n            <ng-template #defaultField>\n              <div [ngClass]=\"getClassNames('fieldControlSize')\">\n                <select\n                  [ngClass]=\"getClassNames('fieldControl')\"\n                  [(ngModel)]=\"rule.field\"\n                  (ngModelChange)=\"changeField($event, rule)\"\n                  [disabled]=\"disabled\"\n                >\n                  <option *ngFor=\"let field of getFields(rule.entity)\" [ngValue]=\"field.value\">\n                    {{ field.name }}\n                  </option>\n                </select>\n              </div>\n            </ng-template>\n\n            <ng-container *ngIf=\"getOperatorTemplate() as template; else defaultOperator\">\n              <ng-container\n                *ngTemplateOutlet=\"template; context: getOperatorContext(rule)\"\n              ></ng-container>\n            </ng-container>\n\n            <ng-template #defaultOperator>\n              <div [ngClass]=\"getClassNames('operatorControlSize')\">\n                <select\n                  [ngClass]=\"getClassNames('operatorControl')\"\n                  [(ngModel)]=\"rule.operator\"\n                  (ngModelChange)=\"changeOperator(rule)\"\n                  [disabled]=\"disabled\"\n                >\n                  <option *ngFor=\"let operator of getOperators(rule.field)\" [ngValue]=\"operator\">\n                    {{ operator }}\n                  </option>\n                </select>\n              </div>\n            </ng-template>\n\n            <ng-container *ngIf=\"findTemplateForRule(rule) as template; else defaultInput\">\n              <ng-container\n                *ngTemplateOutlet=\"template; context: getInputContext(rule)\"\n              ></ng-container>\n            </ng-container>\n\n            <ng-template #defaultInput>\n              <div\n                [ngClass]=\"getClassNames('inputControlSize')\"\n                [ngSwitch]=\"getInputType(rule.field, rule.operator)\"\n              >\n                <input\n                  [ngClass]=\"getClassNames('inputControl')\"\n                  [(ngModel)]=\"rule.value\"\n                  (ngModelChange)=\"changeInput()\"\n                  [disabled]=\"disabled\"\n                  *ngSwitchCase=\"'string'\"\n                  type=\"text\"\n                />\n                <input\n                  [ngClass]=\"getClassNames('inputControl')\"\n                  [(ngModel)]=\"rule.value\"\n                  (ngModelChange)=\"changeInput()\"\n                  [disabled]=\"disabled\"\n                  *ngSwitchCase=\"'number'\"\n                  type=\"number\"\n                />\n                <input\n                  [ngClass]=\"getClassNames('inputControl')\"\n                  [(ngModel)]=\"rule.value\"\n                  (ngModelChange)=\"changeInput()\"\n                  [disabled]=\"disabled\"\n                  *ngSwitchCase=\"'date'\"\n                  type=\"date\"\n                />\n                <input\n                  [ngClass]=\"getClassNames('inputControl')\"\n                  [(ngModel)]=\"rule.value\"\n                  (ngModelChange)=\"changeInput()\"\n                  [disabled]=\"disabled\"\n                  *ngSwitchCase=\"'time'\"\n                  type=\"time\"\n                />\n                <select\n                  [ngClass]=\"getClassNames('inputControl')\"\n                  [(ngModel)]=\"rule.value\"\n                  (ngModelChange)=\"changeInput()\"\n                  [disabled]=\"disabled\"\n                  *ngSwitchCase=\"'category'\"\n                >\n                  <option *ngFor=\"let opt of getOptions(rule.field)\" [ngValue]=\"opt.value\">\n                    {{ opt.name }}\n                  </option>\n                </select>\n                <ng-container *ngSwitchCase=\"'multiselect'\">\n                  <select\n                    [ngClass]=\"getClassNames('inputControl')\"\n                    [(ngModel)]=\"rule.value\"\n                    (ngModelChange)=\"changeInput()\"\n                    [disabled]=\"disabled\"\n                    multiple\n                  >\n                    <option *ngFor=\"let opt of getOptions(rule.field)\" [ngValue]=\"opt.value\">\n                      {{ opt.name }}\n                    </option>\n                  </select>\n                </ng-container>\n                <input\n                  [ngClass]=\"getClassNames('inputControl')\"\n                  [(ngModel)]=\"rule.value\"\n                  (ngModelChange)=\"changeInput()\"\n                  [disabled]=\"disabled\"\n                  *ngSwitchCase=\"'boolean'\"\n                  type=\"checkbox\"\n                />\n              </div>\n            </ng-template>\n          </ng-container>\n          <query-builder\n            *ngIf=\"local.ruleset\"\n            [data]=\"rule\"\n            [disabled]=\"disabled\"\n            [parentTouchedCallback]=\"parentTouchedCallback || onTouchedCallback\"\n            [parentChangeCallback]=\"parentChangeCallback || onChangeCallback\"\n            [parentInputTemplates]=\"parentInputTemplates || inputTemplates\"\n            [parentOperatorTemplate]=\"parentOperatorTemplate || operatorTemplate\"\n            [parentFieldTemplate]=\"parentFieldTemplate || fieldTemplate\"\n            [parentEntityTemplate]=\"parentEntityTemplate || entityTemplate\"\n            [parentSwitchGroupTemplate]=\"parentSwitchGroupTemplate || switchGroupTemplate\"\n            [parentButtonGroupTemplate]=\"parentButtonGroupTemplate || buttonGroupTemplate\"\n            [parentRemoveButtonTemplate]=\"parentRemoveButtonTemplate || removeButtonTemplate\"\n            [parentEmptyWarningTemplate]=\"parentEmptyWarningTemplate || emptyWarningTemplate\"\n            [parentArrowIconTemplate]=\"parentArrowIconTemplate || arrowIconTemplate\"\n            [parentValue]=\"data\"\n            [classNames]=\"classNames\"\n            [config]=\"config\"\n            [allowRuleset]=\"allowRuleset\"\n            [allowCollapse]=\"allowCollapse\"\n            [emptyMessage]=\"emptyMessage\"\n            [operatorMap]=\"operatorMap\"\n          >\n          </query-builder>\n\n          <ng-container *ngIf=\"getEmptyWarningTemplate() as template; else defaultEmptyWarning\">\n            <ng-container *ngIf=\"local.invalid\">\n              <ng-container\n                *ngTemplateOutlet=\"template; context: getEmptyWarningContext()\"\n              ></ng-container>\n            </ng-container>\n          </ng-container>\n\n          <ng-template #defaultEmptyWarning>\n            <p [ngClass]=\"getClassNames('emptyWarning')\" *ngIf=\"local.invalid\">\n              {{ emptyMessage }}\n            </p>\n          </ng-template>\n        </li>\n      </ng-container>\n    </ng-container>\n  </ul>\n</div>\n", styles: ["@charset \"UTF-8\";:host{display:block;width:100%}:host .q-icon{font-style:normal;font-size:12px}:host .q-remove-icon:before{content:\"\\274c\"}:host .q-arrow-icon-button{float:left;margin:4px 6px 4px 0;transform:rotate(90deg);transition:linear .25s transform;cursor:pointer}:host .q-arrow-icon-button.q-collapsed{transform:rotate(0)}:host .q-arrow-icon:before{content:\"\\25b6\"}:host .q-add-icon{color:#555}:host .q-add-icon:before{content:\"\\2795\"}:host .q-remove-button{color:#b3415d;width:31px}:host .q-switch-group,:host .q-button-group{font-family:Lucida Grande,Tahoma,Verdana,sans-serif;overflow:hidden}:host .q-right-align{float:right}:host .q-button{margin-left:8px;padding:0 8px;background-color:#fff}:host .q-button:disabled{display:none}:host .q-control-size{display:inline-block;vertical-align:top;padding-right:10px}:host .q-input-control,:host .q-operator-control,:host .q-field-control,:host .q-entity-control{display:inline-block;padding:5px 8px;color:#555;background-color:#fff;background-image:none;border:1px solid #ccc;border-radius:4px;box-sizing:border-box;width:auto;min-width:180px}:host .q-input-control:disabled,:host .q-operator-control:disabled,:host .q-field-control:disabled,:host .q-entity-control:disabled{border-color:transparent}:host .q-operator-control,:host .q-field-control,:host .q-entity-control,:host .q-input-control:not([type=checkbox]){min-height:32px;-webkit-appearance:none}:host .q-switch-label,:host .q-button{float:left;margin-bottom:0;font-size:14px;line-height:30px;font-weight:400;text-align:center;text-shadow:none;border:1px solid rgba(0,0,0,.2);box-sizing:border-box}:host .q-switch-label:hover,:host .q-button:hover{cursor:pointer;background-color:#f0f0f0}:host .q-switch-label{background-color:#e4e4e4;padding:0 8px}:host .q-switch-radio{position:absolute;clip:rect(0,0,0,0);height:1px;width:1px;border:0;overflow:hidden}:host .q-switch-radio:checked+.q-switch-label{border:1px solid rgb(97,158,215);background:#fff;color:#3176b3}:host .q-switch-radio:disabled+.q-switch-label{display:none}:host .q-switch-radio:checked:disabled+.q-switch-label{display:initial;color:initial;cursor:default;border-color:transparent}:host .q-invalid-ruleset{border:1px solid rgba(179,65,93,.5)!important;background:#b3415d1a!important}:host .q-empty-warning{color:#8d252e;text-align:center}:host .q-ruleset{border:1px solid #ccc}:host .q-rule{border:1px solid #ccc;background:#fff}:host .q-transition{-webkit-transition:all .1s ease-in-out;-moz-transition:all .1s ease-in-out;-ms-transition:all .1s ease-in-out;-o-transition:all .1s ease-in-out;transition:all .1s ease-in-out}:host .q-tree-container{width:100%;overflow:hidden;transition:ease-in .25s max-height}:host .q-tree-container.q-collapsed{max-height:0!important}:host .q-tree{list-style:none;margin:4px 0 2px}:host .q-row{padding:6px 8px;margin-top:6px}:host .q-connector{position:relative}:host .q-connector:before{top:-5px;border-width:0 0 2px 2px}:host .q-connector:after{border-width:0 0 0 2px;top:50%}:host .q-connector:before,:host .q-connector:after{content:\"\";left:-12px;border-color:#ccc;border-style:solid;width:9px;height:calc(50% + 6px);position:absolute}:host .q-connector:last-child:after{content:none}:host .q-inline-block-display{display:inline-block;vertical-align:top}\n"] }]
        }], ctorParameters: () => [{ type: i0.ChangeDetectorRef }], propDecorators: { disabled: [{
                type: Input
            }], data: [{
                type: Input
            }], condition: [{
                type: HostBinding,
                args: ["attr.query-builder-condition"]
            }], allowRuleset: [{
                type: Input
            }], allowCollapse: [{
                type: Input
            }], emptyMessage: [{
                type: Input
            }], classNames: [{
                type: Input
            }], operatorMap: [{
                type: Input
            }], parentValue: [{
                type: Input
            }], config: [{
                type: Input
            }], parentArrowIconTemplate: [{
                type: Input
            }], parentInputTemplates: [{
                type: Input
            }], parentOperatorTemplate: [{
                type: Input
            }], parentFieldTemplate: [{
                type: Input
            }], parentEntityTemplate: [{
                type: Input
            }], parentSwitchGroupTemplate: [{
                type: Input
            }], parentButtonGroupTemplate: [{
                type: Input
            }], parentRemoveButtonTemplate: [{
                type: Input
            }], parentEmptyWarningTemplate: [{
                type: Input
            }], parentChangeCallback: [{
                type: Input
            }], parentTouchedCallback: [{
                type: Input
            }], persistValueOnFieldChange: [{
                type: Input
            }], treeContainer: [{
                type: ViewChild,
                args: ["treeContainer", { static: true }]
            }], buttonGroupTemplate: [{
                type: ContentChild,
                args: [QueryButtonGroupDirective]
            }], switchGroupTemplate: [{
                type: ContentChild,
                args: [QuerySwitchGroupDirective]
            }], fieldTemplate: [{
                type: ContentChild,
                args: [QueryFieldDirective]
            }], entityTemplate: [{
                type: ContentChild,
                args: [QueryEntityDirective]
            }], operatorTemplate: [{
                type: ContentChild,
                args: [QueryOperatorDirective]
            }], removeButtonTemplate: [{
                type: ContentChild,
                args: [QueryRemoveButtonDirective]
            }], emptyWarningTemplate: [{
                type: ContentChild,
                args: [QueryEmptyWarningDirective]
            }], inputTemplates: [{
                type: ContentChildren,
                args: [QueryInputDirective, { descendants: true }]
            }], arrowIconTemplate: [{
                type: ContentChild,
                args: [QueryArrowIconDirective]
            }], value: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnktYnVpbGRlci5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9uZ3gtYW5ndWxhci1xdWVyeS1idWlsZGVyL3NyYy9saWIvcXVlcnktYnVpbGRlci9xdWVyeS1idWlsZGVyLmNvbXBvbmVudC50cyIsIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL25neC1hbmd1bGFyLXF1ZXJ5LWJ1aWxkZXIvc3JjL2xpYi9xdWVyeS1idWlsZGVyL3F1ZXJ5LWJ1aWxkZXIuY29tcG9uZW50Lmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUdMLGlCQUFpQixFQUNqQixhQUFhLEVBR2QsTUFBTSxnQkFBZ0IsQ0FBQztBQUN4QixPQUFPLEVBQUUsc0JBQXNCLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQztBQUNwRSxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUM5RCxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSwwQkFBMEIsQ0FBQztBQUNoRSxPQUFPLEVBQUUseUJBQXlCLEVBQUUsTUFBTSxnQ0FBZ0MsQ0FBQztBQUMzRSxPQUFPLEVBQUUseUJBQXlCLEVBQUUsTUFBTSxnQ0FBZ0MsQ0FBQztBQUMzRSxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUM5RCxPQUFPLEVBQUUsMEJBQTBCLEVBQUUsTUFBTSxpQ0FBaUMsQ0FBQztBQUM3RSxPQUFPLEVBQUUsMEJBQTBCLEVBQUUsTUFBTSxpQ0FBaUMsQ0FBQztBQUM3RSxPQUFPLEVBQUUsdUJBQXVCLEVBQUUsTUFBTSw4QkFBOEIsQ0FBQztBQW9CdkUsT0FBTyxFQUVMLFNBQVMsRUFDVCxZQUFZLEVBQ1osZUFBZSxFQUNmLFVBQVUsRUFDVixLQUFLLEVBTUwsU0FBUyxFQUVULFdBQVcsRUFDWixNQUFNLGVBQWUsQ0FBQzs7OztBQUV2QixNQUFNLENBQUMsTUFBTSxzQkFBc0IsR0FB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QUFtQjtnQkFDRyxjQUFjO3NCQUFqRCxZQUFZO3VCQUFDLG9CQUFvQjtnQkFFbEMsZ0JBQWdCO3NCQURmLFlBQVk7dUJBQUMsc0JBQXNCO2dCQUdwQyxvQkFBb0I7c0JBRG5CLFlBQVk7dUJBQUMsMEJBQTBCO2dCQUd4QyxvQkFBb0I7c0JBRG5CLFlBQVk7dUJBQUMsMEJBQTBCO2dCQUd4QyxjQUFjO3NCQURiLGVBQWU7dUJBQUMsbUJBQW1CLEVBQUUsRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFO2dCQUczRCxpQkFBaUI7c0JBRGhCLFlBQVk7dUJBQUMsdUJBQXVCO2dCQThFakMsS0FBSztzQkFEUixLQUFLIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgQWJzdHJhY3RDb250cm9sLFxuICBDb250cm9sVmFsdWVBY2Nlc3NvcixcbiAgTkdfVkFMVUVfQUNDRVNTT1IsXG4gIE5HX1ZBTElEQVRPUlMsXG4gIFZhbGlkYXRpb25FcnJvcnMsXG4gIFZhbGlkYXRvclxufSBmcm9tIFwiQGFuZ3VsYXIvZm9ybXNcIjtcbmltcG9ydCB7IFF1ZXJ5T3BlcmF0b3JEaXJlY3RpdmUgfSBmcm9tIFwiLi9xdWVyeS1vcGVyYXRvci5kaXJlY3RpdmVcIjtcbmltcG9ydCB7IFF1ZXJ5RmllbGREaXJlY3RpdmUgfSBmcm9tIFwiLi9xdWVyeS1maWVsZC5kaXJlY3RpdmVcIjtcbmltcG9ydCB7IFF1ZXJ5RW50aXR5RGlyZWN0aXZlIH0gZnJvbSBcIi4vcXVlcnktZW50aXR5LmRpcmVjdGl2ZVwiO1xuaW1wb3J0IHsgUXVlcnlTd2l0Y2hHcm91cERpcmVjdGl2ZSB9IGZyb20gXCIuL3F1ZXJ5LXN3aXRjaC1ncm91cC5kaXJlY3RpdmVcIjtcbmltcG9ydCB7IFF1ZXJ5QnV0dG9uR3JvdXBEaXJlY3RpdmUgfSBmcm9tIFwiLi9xdWVyeS1idXR0b24tZ3JvdXAuZGlyZWN0aXZlXCI7XG5pbXBvcnQgeyBRdWVyeUlucHV0RGlyZWN0aXZlIH0gZnJvbSBcIi4vcXVlcnktaW5wdXQuZGlyZWN0aXZlXCI7XG5pbXBvcnQgeyBRdWVyeVJlbW92ZUJ1dHRvbkRpcmVjdGl2ZSB9IGZyb20gXCIuL3F1ZXJ5LXJlbW92ZS1idXR0b24uZGlyZWN0aXZlXCI7XG5pbXBvcnQgeyBRdWVyeUVtcHR5V2FybmluZ0RpcmVjdGl2ZSB9IGZyb20gXCIuL3F1ZXJ5LWVtcHR5LXdhcm5pbmcuZGlyZWN0aXZlXCI7XG5pbXBvcnQgeyBRdWVyeUFycm93SWNvbkRpcmVjdGl2ZSB9IGZyb20gXCIuL3F1ZXJ5LWFycm93LWljb24uZGlyZWN0aXZlXCI7XG5pbXBvcnQge1xuICBCdXR0b25Hcm91cENvbnRleHQsXG4gIEVudGl0eSxcbiAgRmllbGQsXG4gIFN3aXRjaEdyb3VwQ29udGV4dCxcbiAgRW50aXR5Q29udGV4dCxcbiAgRmllbGRDb250ZXh0LFxuICBJbnB1dENvbnRleHQsXG4gIExvY2FsUnVsZU1ldGEsXG4gIE9wZXJhdG9yQ29udGV4dCxcbiAgT3B0aW9uLFxuICBRdWVyeUJ1aWxkZXJDbGFzc05hbWVzLFxuICBRdWVyeUJ1aWxkZXJDb25maWcsXG4gIFJlbW92ZUJ1dHRvbkNvbnRleHQsXG4gIEFycm93SWNvbkNvbnRleHQsXG4gIFJ1bGUsXG4gIFJ1bGVTZXQsXG4gIEVtcHR5V2FybmluZ0NvbnRleHRcbn0gZnJvbSBcIi4vcXVlcnktYnVpbGRlci5pbnRlcmZhY2VzXCI7XG5pbXBvcnQge1xuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgQ29tcG9uZW50LFxuICBDb250ZW50Q2hpbGQsXG4gIENvbnRlbnRDaGlsZHJlbixcbiAgZm9yd2FyZFJlZixcbiAgSW5wdXQsXG4gIE9uQ2hhbmdlcyxcbiAgT25Jbml0LFxuICBRdWVyeUxpc3QsXG4gIFNpbXBsZUNoYW5nZXMsXG4gIFRlbXBsYXRlUmVmLFxuICBWaWV3Q2hpbGQsXG4gIEVsZW1lbnRSZWYsXG4gIEhvc3RCaW5kaW5nXG59IGZyb20gXCJAYW5ndWxhci9jb3JlXCI7XG5cbmV4cG9ydCBjb25zdCBDT05UUk9MX1ZBTFVFX0FDQ0VTU09SOiBhbnkgPSB7XG4gIHByb3ZpZGU6IE5HX1ZBTFVFX0FDQ0VTU09SLFxuICB1c2VFeGlzdGluZzogZm9yd2FyZFJlZigoKSA9PiBRdWVyeUJ1aWxkZXJDb21wb25lbnQpLFxuICBtdWx0aTogdHJ1ZVxufTtcblxuZXhwb3J0IGNvbnN0IFZBTElEQVRPUjogYW55ID0ge1xuICBwcm92aWRlOiBOR19WQUxJREFUT1JTLFxuICB1c2VFeGlzdGluZzogZm9yd2FyZFJlZigoKSA9PiBRdWVyeUJ1aWxkZXJDb21wb25lbnQpLFxuICBtdWx0aTogdHJ1ZVxufTtcblxuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiBcInF1ZXJ5LWJ1aWxkZXJcIixcbiAgdGVtcGxhdGVVcmw6IFwiLi9xdWVyeS1idWlsZGVyLmNvbXBvbmVudC5odG1sXCIsXG4gIHN0eWxlVXJsczogW1wiLi9xdWVyeS1idWlsZGVyLmNvbXBvbmVudC5zY3NzXCJdLFxuICBwcm92aWRlcnM6IFtDT05UUk9MX1ZBTFVFX0FDQ0VTU09SLCBWQUxJREFUT1JdXG59KVxuZXhwb3J0IGNsYXNzIFF1ZXJ5QnVpbGRlckNvbXBvbmVudCBpbXBsZW1lbnRzIE9uQ2hhbmdlcywgQ29udHJvbFZhbHVlQWNjZXNzb3IsIFZhbGlkYXRvciB7XG4gIHB1YmxpYyBmaWVsZHM6IEZpZWxkW107XG4gIHB1YmxpYyBmaWx0ZXJGaWVsZHM6IEZpZWxkW107XG4gIHB1YmxpYyBlbnRpdGllczogRW50aXR5W107XG4gIHB1YmxpYyBkZWZhdWx0Q2xhc3NOYW1lczogUXVlcnlCdWlsZGVyQ2xhc3NOYW1lcyA9IHtcbiAgICBhcnJvd0ljb25CdXR0b246IFwicS1hcnJvdy1pY29uLWJ1dHRvblwiLFxuICAgIGFycm93SWNvbjogXCJxLWljb24gcS1hcnJvdy1pY29uXCIsXG4gICAgcmVtb3ZlSWNvbjogXCJxLWljb24gcS1yZW1vdmUtaWNvblwiLFxuICAgIGFkZEljb246IFwicS1pY29uIHEtYWRkLWljb25cIixcbiAgICBidXR0b246IFwicS1idXR0b25cIixcbiAgICBidXR0b25Hcm91cDogXCJxLWJ1dHRvbi1ncm91cFwiLFxuICAgIHJlbW92ZUJ1dHRvbjogXCJxLXJlbW92ZS1idXR0b25cIixcbiAgICBzd2l0Y2hHcm91cDogXCJxLXN3aXRjaC1ncm91cFwiLFxuICAgIHN3aXRjaExhYmVsOiBcInEtc3dpdGNoLWxhYmVsXCIsXG4gICAgc3dpdGNoUmFkaW86IFwicS1zd2l0Y2gtcmFkaW9cIixcbiAgICByaWdodEFsaWduOiBcInEtcmlnaHQtYWxpZ25cIixcbiAgICB0cmFuc2l0aW9uOiBcInEtdHJhbnNpdGlvblwiLFxuICAgIGNvbGxhcHNlZDogXCJxLWNvbGxhcHNlZFwiLFxuICAgIHRyZWVDb250YWluZXI6IFwicS10cmVlLWNvbnRhaW5lclwiLFxuICAgIHRyZWU6IFwicS10cmVlXCIsXG4gICAgcm93OiBcInEtcm93XCIsXG4gICAgY29ubmVjdG9yOiBcInEtY29ubmVjdG9yXCIsXG4gICAgcnVsZTogXCJxLXJ1bGVcIixcbiAgICBydWxlU2V0OiBcInEtcnVsZXNldFwiLFxuICAgIGludmFsaWRSdWxlU2V0OiBcInEtaW52YWxpZC1ydWxlc2V0XCIsXG4gICAgZW1wdHlXYXJuaW5nOiBcInEtZW1wdHktd2FybmluZ1wiLFxuICAgIGZpZWxkQ29udHJvbDogXCJxLWZpZWxkLWNvbnRyb2xcIixcbiAgICBmaWVsZENvbnRyb2xTaXplOiBcInEtY29udHJvbC1zaXplXCIsXG4gICAgZW50aXR5Q29udHJvbDogXCJxLWVudGl0eS1jb250cm9sXCIsXG4gICAgZW50aXR5Q29udHJvbFNpemU6IFwicS1jb250cm9sLXNpemVcIixcbiAgICBvcGVyYXRvckNvbnRyb2w6IFwicS1vcGVyYXRvci1jb250cm9sXCIsXG4gICAgb3BlcmF0b3JDb250cm9sU2l6ZTogXCJxLWNvbnRyb2wtc2l6ZVwiLFxuICAgIGlucHV0Q29udHJvbDogXCJxLWlucHV0LWNvbnRyb2xcIixcbiAgICBpbnB1dENvbnRyb2xTaXplOiBcInEtY29udHJvbC1zaXplXCJcbiAgfTtcbiAgcHVibGljIGRlZmF1bHRPcGVyYXRvck1hcDogeyBba2V5OiBzdHJpbmddOiBzdHJpbmdbXSB9ID0ge1xuICAgIHN0cmluZzogW1wiPVwiLCBcIiE9XCIsIFwiY29udGFpbnNcIiwgXCJsaWtlXCJdLFxuICAgIG51bWJlcjogW1wiPVwiLCBcIiE9XCIsIFwiPlwiLCBcIj49XCIsIFwiPFwiLCBcIjw9XCJdLFxuICAgIHRpbWU6IFtcIj1cIiwgXCIhPVwiLCBcIj5cIiwgXCI+PVwiLCBcIjxcIiwgXCI8PVwiXSxcbiAgICBkYXRlOiBbXCI9XCIsIFwiIT1cIiwgXCI+XCIsIFwiPj1cIiwgXCI8XCIsIFwiPD1cIl0sXG4gICAgY2F0ZWdvcnk6IFtcIj1cIiwgXCIhPVwiLCBcImluXCIsIFwibm90IGluXCJdLFxuICAgIGJvb2xlYW46IFtcIj1cIl1cbiAgfTtcbiAgQElucHV0KCkgZGlzYWJsZWQgPSBmYWxzZTtcbiAgQElucHV0KCkgZGF0YTogUnVsZVNldCA9IHsgY29uZGl0aW9uOiBcImFuZFwiLCBydWxlczogW10gfTtcblxuICBASG9zdEJpbmRpbmcoXCJhdHRyLnF1ZXJ5LWJ1aWxkZXItY29uZGl0aW9uXCIpIGdldCBjb25kaXRpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YT8uY29uZGl0aW9uO1xuICB9XG5cbiAgLy8gRm9yIENvbnRyb2xWYWx1ZUFjY2Vzc29yIGludGVyZmFjZVxuICBwdWJsaWMgb25DaGFuZ2VDYWxsYmFjayE6ICgpID0+IHZvaWQ7XG4gIHB1YmxpYyBvblRvdWNoZWRDYWxsYmFjayE6ICgpID0+IGFueTtcblxuICBASW5wdXQoKSBhbGxvd1J1bGVzZXQgPSB0cnVlO1xuICBASW5wdXQoKSBhbGxvd0NvbGxhcHNlID0gZmFsc2U7XG4gIEBJbnB1dCgpIGVtcHR5TWVzc2FnZSA9IFwiQSBydWxlc2V0IGNhbm5vdCBiZSBlbXB0eS4gUGxlYXNlIGFkZCBhIHJ1bGUgb3IgcmVtb3ZlIGl0IGFsbCB0b2dldGhlci5cIjtcbiAgQElucHV0KCkgY2xhc3NOYW1lczogUXVlcnlCdWlsZGVyQ2xhc3NOYW1lcyA9IHt9O1xuICBASW5wdXQoKSBvcGVyYXRvck1hcDogeyBba2V5OiBzdHJpbmddOiBzdHJpbmdbXSB9ID0ge307XG4gIEBJbnB1dCgpIHBhcmVudFZhbHVlPzogUnVsZVNldDtcbiAgQElucHV0KCkgY29uZmlnOiBRdWVyeUJ1aWxkZXJDb25maWcgPSB7IGZpZWxkczoge30gfTtcbiAgQElucHV0KCkgcGFyZW50QXJyb3dJY29uVGVtcGxhdGUhOiBRdWVyeUFycm93SWNvbkRpcmVjdGl2ZTtcbiAgQElucHV0KCkgcGFyZW50SW5wdXRUZW1wbGF0ZXMhOiBRdWVyeUxpc3Q8UXVlcnlJbnB1dERpcmVjdGl2ZT47XG4gIEBJbnB1dCgpIHBhcmVudE9wZXJhdG9yVGVtcGxhdGUhOiBRdWVyeU9wZXJhdG9yRGlyZWN0aXZlO1xuICBASW5wdXQoKSBwYXJlbnRGaWVsZFRlbXBsYXRlITogUXVlcnlGaWVsZERpcmVjdGl2ZTtcbiAgQElucHV0KCkgcGFyZW50RW50aXR5VGVtcGxhdGUhOiBRdWVyeUVudGl0eURpcmVjdGl2ZTtcbiAgQElucHV0KCkgcGFyZW50U3dpdGNoR3JvdXBUZW1wbGF0ZSE6IFF1ZXJ5U3dpdGNoR3JvdXBEaXJlY3RpdmU7XG4gIEBJbnB1dCgpIHBhcmVudEJ1dHRvbkdyb3VwVGVtcGxhdGUhOiBRdWVyeUJ1dHRvbkdyb3VwRGlyZWN0aXZlO1xuICBASW5wdXQoKSBwYXJlbnRSZW1vdmVCdXR0b25UZW1wbGF0ZSE6IFF1ZXJ5UmVtb3ZlQnV0dG9uRGlyZWN0aXZlO1xuICBASW5wdXQoKSBwYXJlbnRFbXB0eVdhcm5pbmdUZW1wbGF0ZSE6IFF1ZXJ5RW1wdHlXYXJuaW5nRGlyZWN0aXZlO1xuICBASW5wdXQoKSBwYXJlbnRDaGFuZ2VDYWxsYmFjayE6ICgpID0+IHZvaWQ7XG4gIEBJbnB1dCgpIHBhcmVudFRvdWNoZWRDYWxsYmFjayE6ICgpID0+IHZvaWQ7XG4gIEBJbnB1dCgpIHBlcnNpc3RWYWx1ZU9uRmllbGRDaGFuZ2UgPSBmYWxzZTtcblxuICBAVmlld0NoaWxkKFwidHJlZUNvbnRhaW5lclwiLCB7IHN0YXRpYzogdHJ1ZSB9KSB0cmVlQ29udGFpbmVyITogRWxlbWVudFJlZjtcblxuICBAQ29udGVudENoaWxkKFF1ZXJ5QnV0dG9uR3JvdXBEaXJlY3RpdmUpXG4gIGJ1dHRvbkdyb3VwVGVtcGxhdGUhOiBRdWVyeUJ1dHRvbkdyb3VwRGlyZWN0aXZlO1xuICBAQ29udGVudENoaWxkKFF1ZXJ5U3dpdGNoR3JvdXBEaXJlY3RpdmUpXG4gIHN3aXRjaEdyb3VwVGVtcGxhdGUhOiBRdWVyeVN3aXRjaEdyb3VwRGlyZWN0aXZlO1xuICBAQ29udGVudENoaWxkKFF1ZXJ5RmllbGREaXJlY3RpdmUpIGZpZWxkVGVtcGxhdGUhOiBRdWVyeUZpZWxkRGlyZWN0aXZlO1xuICBAQ29udGVudENoaWxkKFF1ZXJ5RW50aXR5RGlyZWN0aXZlKSBlbnRpdHlUZW1wbGF0ZSE6IFF1ZXJ5RW50aXR5RGlyZWN0aXZlO1xuICBAQ29udGVudENoaWxkKFF1ZXJ5T3BlcmF0b3JEaXJlY3RpdmUpXG4gIG9wZXJhdG9yVGVtcGxhdGUhOiBRdWVyeU9wZXJhdG9yRGlyZWN0aXZlO1xuICBAQ29udGVudENoaWxkKFF1ZXJ5UmVtb3ZlQnV0dG9uRGlyZWN0aXZlKVxuICByZW1vdmVCdXR0b25UZW1wbGF0ZSE6IFF1ZXJ5UmVtb3ZlQnV0dG9uRGlyZWN0aXZlO1xuICBAQ29udGVudENoaWxkKFF1ZXJ5RW1wdHlXYXJuaW5nRGlyZWN0aXZlKVxuICBlbXB0eVdhcm5pbmdUZW1wbGF0ZSE6IFF1ZXJ5RW1wdHlXYXJuaW5nRGlyZWN0aXZlO1xuICBAQ29udGVudENoaWxkcmVuKFF1ZXJ5SW5wdXREaXJlY3RpdmUsIHsgZGVzY2VuZGFudHM6IHRydWUgfSlcbiAgaW5wdXRUZW1wbGF0ZXMhOiBRdWVyeUxpc3Q8UXVlcnlJbnB1dERpcmVjdGl2ZT47XG4gIEBDb250ZW50Q2hpbGQoUXVlcnlBcnJvd0ljb25EaXJlY3RpdmUpXG4gIGFycm93SWNvblRlbXBsYXRlITogUXVlcnlBcnJvd0ljb25EaXJlY3RpdmU7XG5cbiAgcHJpdmF0ZSBkZWZhdWx0VGVtcGxhdGVUeXBlczogc3RyaW5nW10gPSBbXG4gICAgXCJzdHJpbmdcIixcbiAgICBcIm51bWJlclwiLFxuICAgIFwidGltZVwiLFxuICAgIFwiZGF0ZVwiLFxuICAgIFwiY2F0ZWdvcnlcIixcbiAgICBcImJvb2xlYW5cIixcbiAgICBcIm11bHRpc2VsZWN0XCJcbiAgXTtcbiAgcHJpdmF0ZSBkZWZhdWx0UGVyc2lzdFZhbHVlVHlwZXM6IHN0cmluZ1tdID0gW1wic3RyaW5nXCIsIFwibnVtYmVyXCIsIFwidGltZVwiLCBcImRhdGVcIiwgXCJib29sZWFuXCJdO1xuICBwcml2YXRlIGRlZmF1bHRFbXB0eUxpc3Q6IGFueVtdID0gW107XG4gIHByaXZhdGUgb3BlcmF0b3JzQ2FjaGU6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nW10gfSA9IHt9O1xuICBwcml2YXRlIGlucHV0Q29udGV4dENhY2hlID0gbmV3IE1hcDxSdWxlLCBJbnB1dENvbnRleHQ+KCk7XG4gIHByaXZhdGUgb3BlcmF0b3JDb250ZXh0Q2FjaGUgPSBuZXcgTWFwPFJ1bGUsIE9wZXJhdG9yQ29udGV4dD4oKTtcbiAgcHJpdmF0ZSBmaWVsZENvbnRleHRDYWNoZSA9IG5ldyBNYXA8UnVsZSwgRmllbGRDb250ZXh0PigpO1xuICBwcml2YXRlIGVudGl0eUNvbnRleHRDYWNoZSA9IG5ldyBNYXA8UnVsZSwgRW50aXR5Q29udGV4dD4oKTtcbiAgcHJpdmF0ZSByZW1vdmVCdXR0b25Db250ZXh0Q2FjaGUgPSBuZXcgTWFwPFJ1bGUsIFJlbW92ZUJ1dHRvbkNvbnRleHQ+KCk7XG4gIHByaXZhdGUgYnV0dG9uR3JvdXBDb250ZXh0ITogQnV0dG9uR3JvdXBDb250ZXh0O1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgY2hhbmdlRGV0ZWN0b3JSZWY6IENoYW5nZURldGVjdG9yUmVmKSB7XG4gICAgdGhpcy5maWVsZHMgPSBbXTtcbiAgICB0aGlzLmZpbHRlckZpZWxkcyA9IFtdO1xuICAgIHRoaXMuZW50aXRpZXMgPSBbXTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS1PbkNoYW5nZXMgSW1wbGVtZW50YXRpb24tLS0tLS0tLS0tXG5cbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcykge1xuICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuY29uZmlnO1xuICAgIGNvbnN0IHR5cGUgPSB0eXBlb2YgY29uZmlnO1xuICAgIGlmICh0eXBlID09PSBcIm9iamVjdFwiKSB7XG4gICAgICB0aGlzLmZpZWxkcyA9IE9iamVjdC5rZXlzKGNvbmZpZy5maWVsZHMpLm1hcCgodmFsdWUpID0+IHtcbiAgICAgICAgY29uc3QgZmllbGQgPSBjb25maWcuZmllbGRzW3ZhbHVlXTtcbiAgICAgICAgZmllbGQudmFsdWUgPSBmaWVsZC52YWx1ZSB8fCB2YWx1ZTtcbiAgICAgICAgcmV0dXJuIGZpZWxkO1xuICAgICAgfSk7XG4gICAgICBpZiAoY29uZmlnLmVudGl0aWVzKSB7XG4gICAgICAgIHRoaXMuZW50aXRpZXMgPSBPYmplY3Qua2V5cyhjb25maWcuZW50aXRpZXMpLm1hcCgodmFsdWUpID0+IHtcbiAgICAgICAgICBjb25zdCBlbnRpdHkgPSBjb25maWcuZW50aXRpZXMgPyBjb25maWcuZW50aXRpZXNbdmFsdWVdIDogKFtdIGFzIGFueSk7XG4gICAgICAgICAgZW50aXR5LnZhbHVlID0gZW50aXR5LnZhbHVlIHx8IHZhbHVlO1xuICAgICAgICAgIHJldHVybiBlbnRpdHk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5lbnRpdGllcyA9IFtdO1xuICAgICAgfVxuICAgICAgdGhpcy5vcGVyYXRvcnNDYWNoZSA9IHt9O1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkICdjb25maWcnIG11c3QgYmUgYSB2YWxpZCBvYmplY3QsIGdvdCAke3R5cGV9IGluc3RlYWQuYCk7XG4gICAgfVxuICB9XG5cbiAgLy8gLS0tLS0tLS0tLVZhbGlkYXRvciBJbXBsZW1lbnRhdGlvbi0tLS0tLS0tLS1cblxuICB2YWxpZGF0ZShjb250cm9sOiBBYnN0cmFjdENvbnRyb2wpOiBWYWxpZGF0aW9uRXJyb3JzIHwgbnVsbCB7XG4gICAgY29uc3QgZXJyb3JzOiB7IFtrZXk6IHN0cmluZ106IGFueSB9ID0ge307XG4gICAgY29uc3QgcnVsZUVycm9yU3RvcmUgPSBbXSBhcyBhbnk7XG4gICAgbGV0IGhhc0Vycm9ycyA9IGZhbHNlO1xuXG4gICAgaWYgKCF0aGlzLmNvbmZpZy5hbGxvd0VtcHR5UnVsZXNldHMgJiYgdGhpcy5jaGVja0VtcHR5UnVsZUluUnVsZXNldCh0aGlzLmRhdGEpKSB7XG4gICAgICBlcnJvcnMuZW1wdHkgPSBcIkVtcHR5IHJ1bGVzZXRzIGFyZSBub3QgYWxsb3dlZC5cIjtcbiAgICAgIGhhc0Vycm9ycyA9IHRydWU7XG4gICAgfVxuXG4gICAgdGhpcy52YWxpZGF0ZVJ1bGVzSW5SdWxlc2V0KHRoaXMuZGF0YSwgcnVsZUVycm9yU3RvcmUpO1xuXG4gICAgaWYgKHJ1bGVFcnJvclN0b3JlLmxlbmd0aCkge1xuICAgICAgZXJyb3JzLnJ1bGVzID0gcnVsZUVycm9yU3RvcmU7XG4gICAgICBoYXNFcnJvcnMgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gaGFzRXJyb3JzID8gZXJyb3JzIDogbnVsbDtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS1Db250cm9sVmFsdWVBY2Nlc3NvciBJbXBsZW1lbnRhdGlvbi0tLS0tLS0tLS1cblxuICBASW5wdXQoKVxuICBnZXQgdmFsdWUoKTogUnVsZVNldCB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YTtcbiAgfVxuICBzZXQgdmFsdWUodmFsdWU6IFJ1bGVTZXQpIHtcbiAgICAvLyBXaGVuIGNvbXBvbmVudCBpcyBpbml0aWFsaXplZCB3aXRob3V0IGEgZm9ybUNvbnRyb2wsIG51bGwgaXMgcGFzc2VkIHRvIHZhbHVlXG4gICAgdGhpcy5kYXRhID0gdmFsdWUgfHwgeyBjb25kaXRpb246IFwiYW5kXCIsIHJ1bGVzOiBbXSB9O1xuICAgIHRoaXMuaGFuZGxlRGF0YUNoYW5nZSgpO1xuICB9XG5cbiAgd3JpdGVWYWx1ZShvYmo6IGFueSk6IHZvaWQge1xuICAgIHRoaXMudmFsdWUgPSBvYmo7XG4gIH1cbiAgcmVnaXN0ZXJPbkNoYW5nZShmbjogYW55KTogdm9pZCB7XG4gICAgdGhpcy5vbkNoYW5nZUNhbGxiYWNrID0gKCkgPT4gZm4odGhpcy5kYXRhKTtcbiAgfVxuICByZWdpc3Rlck9uVG91Y2hlZChmbjogYW55KTogdm9pZCB7XG4gICAgdGhpcy5vblRvdWNoZWRDYWxsYmFjayA9ICgpID0+IGZuKHRoaXMuZGF0YSk7XG4gIH1cbiAgc2V0RGlzYWJsZWRTdGF0ZShpc0Rpc2FibGVkOiBib29sZWFuKTogdm9pZCB7XG4gICAgdGhpcy5kaXNhYmxlZCA9IGlzRGlzYWJsZWQ7XG4gICAgdGhpcy5jaGFuZ2VEZXRlY3RvclJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tRU5ELS0tLS0tLS0tLVxuXG4gIGdldERpc2FibGVkU3RhdGUgPSAoKTogYm9vbGVhbiA9PiB7XG4gICAgcmV0dXJuIHRoaXMuZGlzYWJsZWQ7XG4gIH07XG5cbiAgZmluZFRlbXBsYXRlRm9yUnVsZShydWxlOiBSdWxlKTogVGVtcGxhdGVSZWY8YW55PiB8IGFueSB7XG4gICAgY29uc3QgdHlwZSA9IHRoaXMuZ2V0SW5wdXRUeXBlKHJ1bGUuZmllbGQsIHJ1bGUub3BlcmF0b3IgYXMgc3RyaW5nKTtcbiAgICBpZiAodHlwZSkge1xuICAgICAgY29uc3QgcXVlcnlJbnB1dCA9IHRoaXMuZmluZFF1ZXJ5SW5wdXQodHlwZSk7XG4gICAgICBpZiAocXVlcnlJbnB1dCkge1xuICAgICAgICByZXR1cm4gcXVlcnlJbnB1dC50ZW1wbGF0ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0aGlzLmRlZmF1bHRUZW1wbGF0ZVR5cGVzLmluZGV4T2YodHlwZSkgPT09IC0xKSB7XG4gICAgICAgICAgY29uc29sZS53YXJuKGBDb3VsZCBub3QgZmluZCB0ZW1wbGF0ZSBmb3IgZmllbGQgd2l0aCB0eXBlOiAke3R5cGV9YCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZmluZFF1ZXJ5SW5wdXQodHlwZTogc3RyaW5nKTogUXVlcnlJbnB1dERpcmVjdGl2ZSB7XG4gICAgY29uc3QgdGVtcGxhdGVzID0gdGhpcy5wYXJlbnRJbnB1dFRlbXBsYXRlcyB8fCB0aGlzLmlucHV0VGVtcGxhdGVzIHx8IFtdO1xuICAgIHJldHVybiB0ZW1wbGF0ZXMuZmluZCgoaXRlbSkgPT4gaXRlbS5xdWVyeUlucHV0VHlwZSA9PT0gdHlwZSkgYXMgUXVlcnlJbnB1dERpcmVjdGl2ZTtcbiAgfVxuXG4gIGdldE9wZXJhdG9ycyhmaWVsZDogc3RyaW5nKTogc3RyaW5nW10ge1xuICAgIGlmICh0aGlzLm9wZXJhdG9yc0NhY2hlW2ZpZWxkXSkge1xuICAgICAgcmV0dXJuIHRoaXMub3BlcmF0b3JzQ2FjaGVbZmllbGRdO1xuICAgIH1cbiAgICBsZXQgb3BlcmF0b3JzID0gdGhpcy5kZWZhdWx0RW1wdHlMaXN0O1xuICAgIGNvbnN0IGZpZWxkT2JqZWN0ID0gdGhpcy5jb25maWcuZmllbGRzW2ZpZWxkXTtcblxuICAgIGlmICh0aGlzLmNvbmZpZy5nZXRPcGVyYXRvcnMpIHtcbiAgICAgIHJldHVybiB0aGlzLmNvbmZpZy5nZXRPcGVyYXRvcnMoZmllbGQsIGZpZWxkT2JqZWN0KTtcbiAgICB9XG5cbiAgICBjb25zdCB0eXBlID0gZmllbGRPYmplY3QudHlwZTtcblxuICAgIGlmIChmaWVsZE9iamVjdCAmJiBmaWVsZE9iamVjdC5vcGVyYXRvcnMpIHtcbiAgICAgIG9wZXJhdG9ycyA9IGZpZWxkT2JqZWN0Lm9wZXJhdG9ycztcbiAgICB9IGVsc2UgaWYgKHR5cGUpIHtcbiAgICAgIG9wZXJhdG9ycyA9XG4gICAgICAgICh0aGlzLm9wZXJhdG9yTWFwICYmIHRoaXMub3BlcmF0b3JNYXBbdHlwZV0pIHx8XG4gICAgICAgIHRoaXMuZGVmYXVsdE9wZXJhdG9yTWFwW3R5cGVdIHx8XG4gICAgICAgIHRoaXMuZGVmYXVsdEVtcHR5TGlzdDtcbiAgICAgIGlmIChvcGVyYXRvcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgICBgTm8gb3BlcmF0b3JzIGZvdW5kIGZvciBmaWVsZCAnJHtmaWVsZH0nIHdpdGggdHlwZSAke2ZpZWxkT2JqZWN0LnR5cGV9LiBgICtcbiAgICAgICAgICAgIGBQbGVhc2UgZGVmaW5lIGFuICdvcGVyYXRvcnMnIHByb3BlcnR5IG9uIHRoZSBmaWVsZCBvciB1c2UgdGhlICdvcGVyYXRvck1hcCcgYmluZGluZyB0byBmaXggdGhpcy5gXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBpZiAoZmllbGRPYmplY3QubnVsbGFibGUpIHtcbiAgICAgICAgb3BlcmF0b3JzID0gb3BlcmF0b3JzLmNvbmNhdChbXCJpcyBudWxsXCIsIFwiaXMgbm90IG51bGxcIl0pO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLndhcm4oYE5vICd0eXBlJyBwcm9wZXJ0eSBmb3VuZCBvbiBmaWVsZDogJyR7ZmllbGR9J2ApO1xuICAgIH1cblxuICAgIC8vIENhY2hlIHJlZmVyZW5jZSB0byBhcnJheSBvYmplY3QsIHNvIGl0IHdvbid0IGJlIGNvbXB1dGVkIG5leHQgdGltZSBhbmQgdHJpZ2dlciBhIHJlcmVuZGVyLlxuICAgIHRoaXMub3BlcmF0b3JzQ2FjaGVbZmllbGRdID0gb3BlcmF0b3JzO1xuICAgIHJldHVybiBvcGVyYXRvcnM7XG4gIH1cblxuICBnZXRGaWVsZHMoZW50aXR5OiBzdHJpbmcpOiBGaWVsZFtdIHtcbiAgICBpZiAodGhpcy5lbnRpdGllcz8ubGVuZ3RoICYmIGVudGl0eSkge1xuICAgICAgcmV0dXJuIHRoaXMuZmllbGRzLmZpbHRlcigoZmllbGQpID0+IHtcbiAgICAgICAgcmV0dXJuIGZpZWxkICYmIGZpZWxkLmVudGl0eSA9PT0gZW50aXR5O1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLmZpZWxkcztcbiAgICB9XG4gIH1cblxuICBnZXRJbnB1dFR5cGUoZmllbGQ6IHN0cmluZywgb3BlcmF0b3I6IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xuICAgIGlmICh0aGlzLmNvbmZpZy5nZXRJbnB1dFR5cGUpIHtcbiAgICAgIHJldHVybiB0aGlzLmNvbmZpZy5nZXRJbnB1dFR5cGUoZmllbGQsIG9wZXJhdG9yKTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuY29uZmlnLmZpZWxkc1tmaWVsZF0pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYE5vIGNvbmZpZ3VyYXRpb24gZm9yIGZpZWxkICcke2ZpZWxkfScgY291bGQgYmUgZm91bmQhIFBsZWFzZSBhZGQgaXQgdG8gY29uZmlnLmZpZWxkcy5gXG4gICAgICApO1xuICAgIH1cblxuICAgIGNvbnN0IHR5cGUgPSB0aGlzLmNvbmZpZy5maWVsZHNbZmllbGRdLnR5cGU7XG4gICAgc3dpdGNoIChvcGVyYXRvcikge1xuICAgICAgY2FzZSBcImlzIG51bGxcIjpcbiAgICAgIGNhc2UgXCJpcyBub3QgbnVsbFwiOlxuICAgICAgICByZXR1cm4gbnVsbDsgLy8gTm8gZGlzcGxheWVkIGNvbXBvbmVudFxuICAgICAgY2FzZSBcImluXCI6XG4gICAgICBjYXNlIFwibm90IGluXCI6XG4gICAgICAgIHJldHVybiB0eXBlID09PSBcImNhdGVnb3J5XCIgfHwgdHlwZSA9PT0gXCJib29sZWFuXCIgPyBcIm11bHRpc2VsZWN0XCIgOiB0eXBlO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHR5cGU7XG4gICAgfVxuICB9XG5cbiAgZ2V0T3B0aW9ucyhmaWVsZDogc3RyaW5nKTogT3B0aW9uW10ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5nZXRPcHRpb25zKSB7XG4gICAgICByZXR1cm4gdGhpcy5jb25maWcuZ2V0T3B0aW9ucyhmaWVsZCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmNvbmZpZy5maWVsZHNbZmllbGRdLm9wdGlvbnMgfHwgdGhpcy5kZWZhdWx0RW1wdHlMaXN0O1xuICB9XG5cbiAgZ2V0Q2xhc3NOYW1lcyguLi5hcmdzOiBzdHJpbmdbXSk6IGFueSB8IHN0cmluZ1tdIHtcbiAgICBjb25zdCBjbHNMb29rdXAgPSB0aGlzLmNsYXNzTmFtZXMgPyB0aGlzLmNsYXNzTmFtZXMgOiAodGhpcy5kZWZhdWx0Q2xhc3NOYW1lcyBhcyBhbnkpO1xuICAgIGNvbnN0IGRlZmF1bHRDbGFzc05hbWVzID0gdGhpcy5kZWZhdWx0Q2xhc3NOYW1lcyBhcyBhbnk7XG4gICAgY29uc3QgY2xhc3NOYW1lcyA9IGFyZ3NcbiAgICAgIC5tYXAoKGlkOiBhbnkpID0+IGNsc0xvb2t1cFtpZF0gfHwgZGVmYXVsdENsYXNzTmFtZXNbaWRdKVxuICAgICAgLmZpbHRlcigoYzogYW55KSA9PiAhIWMpO1xuICAgIHJldHVybiBjbGFzc05hbWVzLmxlbmd0aCA/IGNsYXNzTmFtZXMuam9pbihcIiBcIikgOiBbXTtcbiAgfVxuXG4gIGdldERlZmF1bHRGaWVsZChlbnRpdHk6IEVudGl0eSk6IEZpZWxkIHwgbnVsbCB7XG4gICAgaWYgKCFlbnRpdHkpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH0gZWxzZSBpZiAoZW50aXR5LmRlZmF1bHRGaWVsZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpcy5nZXREZWZhdWx0VmFsdWUoZW50aXR5LmRlZmF1bHRGaWVsZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGVudGl0eUZpZWxkcyA9IHRoaXMuZmllbGRzLmZpbHRlcigoZmllbGQpID0+IHtcbiAgICAgICAgcmV0dXJuIGZpZWxkICYmIGZpZWxkLmVudGl0eSA9PT0gZW50aXR5LnZhbHVlO1xuICAgICAgfSk7XG4gICAgICBpZiAoZW50aXR5RmllbGRzICYmIGVudGl0eUZpZWxkcy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIGVudGl0eUZpZWxkc1swXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgICBgTm8gZmllbGRzIGZvdW5kIGZvciBlbnRpdHkgJyR7ZW50aXR5Lm5hbWV9Jy4gYCArXG4gICAgICAgICAgICBgQSAnZGVmYXVsdE9wZXJhdG9yJyBpcyBhbHNvIG5vdCBzcGVjaWZpZWQgb24gdGhlIGZpZWxkIGNvbmZpZy4gT3BlcmF0b3IgdmFsdWUgd2lsbCBkZWZhdWx0IHRvIG51bGwuYFxuICAgICAgICApO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBnZXREZWZhdWx0T3BlcmF0b3IoZmllbGQ6IEZpZWxkKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgaWYgKGZpZWxkICYmIGZpZWxkLmRlZmF1bHRPcGVyYXRvciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpcy5nZXREZWZhdWx0VmFsdWUoZmllbGQuZGVmYXVsdE9wZXJhdG9yKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3Qgb3BlcmF0b3JzID0gdGhpcy5nZXRPcGVyYXRvcnMoZmllbGQudmFsdWUgYXMgc3RyaW5nKTtcbiAgICAgIGlmIChvcGVyYXRvcnMgJiYgb3BlcmF0b3JzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gb3BlcmF0b3JzWzBdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICAgIGBObyBvcGVyYXRvcnMgZm91bmQgZm9yIGZpZWxkICcke2ZpZWxkLnZhbHVlfScuIGAgK1xuICAgICAgICAgICAgYEEgJ2RlZmF1bHRPcGVyYXRvcicgaXMgYWxzbyBub3Qgc3BlY2lmaWVkIG9uIHRoZSBmaWVsZCBjb25maWcuIE9wZXJhdG9yIHZhbHVlIHdpbGwgZGVmYXVsdCB0byBudWxsLmBcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgYWRkUnVsZShwYXJlbnQ/OiBSdWxlU2V0KTogdm9pZCB7XG4gICAgaWYgKHRoaXMuZGlzYWJsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBwYXJlbnQgPSBwYXJlbnQgfHwgdGhpcy5kYXRhO1xuICAgIGlmICh0aGlzLmNvbmZpZy5hZGRSdWxlKSB7XG4gICAgICB0aGlzLmNvbmZpZy5hZGRSdWxlKHBhcmVudCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGZpZWxkID0gdGhpcy5maWVsZHNbMF07XG4gICAgICBwYXJlbnQucnVsZXMgPSBwYXJlbnQucnVsZXMuY29uY2F0KFtcbiAgICAgICAge1xuICAgICAgICAgIGZpZWxkOiBmaWVsZC52YWx1ZSBhcyBzdHJpbmcsXG4gICAgICAgICAgb3BlcmF0b3I6IHRoaXMuZ2V0RGVmYXVsdE9wZXJhdG9yKGZpZWxkKSBhcyBzdHJpbmcsXG4gICAgICAgICAgdmFsdWU6IHRoaXMuZ2V0RGVmYXVsdFZhbHVlKGZpZWxkLmRlZmF1bHRWYWx1ZSksXG4gICAgICAgICAgZW50aXR5OiBmaWVsZC5lbnRpdHlcbiAgICAgICAgfVxuICAgICAgXSk7XG4gICAgfVxuXG4gICAgdGhpcy5oYW5kbGVUb3VjaGVkKCk7XG4gICAgdGhpcy5oYW5kbGVEYXRhQ2hhbmdlKCk7XG4gIH1cblxuICByZW1vdmVSdWxlKHJ1bGU6IFJ1bGUsIHBhcmVudD86IFJ1bGVTZXQpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5kaXNhYmxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHBhcmVudCA9IHBhcmVudCB8fCB0aGlzLmRhdGE7XG4gICAgaWYgKHRoaXMuY29uZmlnLnJlbW92ZVJ1bGUpIHtcbiAgICAgIHRoaXMuY29uZmlnLnJlbW92ZVJ1bGUocnVsZSwgcGFyZW50KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcGFyZW50LnJ1bGVzID0gcGFyZW50LnJ1bGVzLmZpbHRlcigocikgPT4gciAhPT0gcnVsZSk7XG4gICAgfVxuICAgIHRoaXMuaW5wdXRDb250ZXh0Q2FjaGUuZGVsZXRlKHJ1bGUpO1xuICAgIHRoaXMub3BlcmF0b3JDb250ZXh0Q2FjaGUuZGVsZXRlKHJ1bGUpO1xuICAgIHRoaXMuZmllbGRDb250ZXh0Q2FjaGUuZGVsZXRlKHJ1bGUpO1xuICAgIHRoaXMuZW50aXR5Q29udGV4dENhY2hlLmRlbGV0ZShydWxlKTtcbiAgICB0aGlzLnJlbW92ZUJ1dHRvbkNvbnRleHRDYWNoZS5kZWxldGUocnVsZSk7XG5cbiAgICB0aGlzLmhhbmRsZVRvdWNoZWQoKTtcbiAgICB0aGlzLmhhbmRsZURhdGFDaGFuZ2UoKTtcbiAgfVxuXG4gIGFkZFJ1bGVTZXQocGFyZW50PzogUnVsZVNldCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmRpc2FibGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgcGFyZW50ID0gcGFyZW50IHx8IHRoaXMuZGF0YTtcbiAgICBpZiAodGhpcy5jb25maWcuYWRkUnVsZVNldCkge1xuICAgICAgdGhpcy5jb25maWcuYWRkUnVsZVNldChwYXJlbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBwYXJlbnQucnVsZXMgPSBwYXJlbnQucnVsZXMuY29uY2F0KFt7IGNvbmRpdGlvbjogXCJhbmRcIiwgcnVsZXM6IFtdIH1dKTtcbiAgICB9XG5cbiAgICB0aGlzLmhhbmRsZVRvdWNoZWQoKTtcbiAgICB0aGlzLmhhbmRsZURhdGFDaGFuZ2UoKTtcbiAgfVxuXG4gIHJlbW92ZVJ1bGVTZXQocnVsZXNldD86IFJ1bGVTZXQsIHBhcmVudD86IFJ1bGVTZXQpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5kaXNhYmxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHJ1bGVzZXQgPSBydWxlc2V0IHx8IHRoaXMuZGF0YTtcbiAgICBwYXJlbnQgPSBwYXJlbnQgfHwgdGhpcy5wYXJlbnRWYWx1ZTtcbiAgICBpZiAodGhpcy5jb25maWcucmVtb3ZlUnVsZVNldCkge1xuICAgICAgdGhpcy5jb25maWcucmVtb3ZlUnVsZVNldChydWxlc2V0LCBwYXJlbnQpO1xuICAgIH0gZWxzZSBpZiAocGFyZW50KSB7XG4gICAgICBwYXJlbnQucnVsZXMgPSBwYXJlbnQucnVsZXMuZmlsdGVyKChyKSA9PiByICE9PSBydWxlc2V0KTtcbiAgICB9XG5cbiAgICB0aGlzLmhhbmRsZVRvdWNoZWQoKTtcbiAgICB0aGlzLmhhbmRsZURhdGFDaGFuZ2UoKTtcbiAgfVxuXG4gIHRyYW5zaXRpb25FbmQoZTogRXZlbnQpOiB2b2lkIHtcbiAgICB0aGlzLnRyZWVDb250YWluZXIubmF0aXZlRWxlbWVudC5zdHlsZS5tYXhIZWlnaHQgPSBudWxsO1xuICB9XG5cbiAgdG9nZ2xlQ29sbGFwc2UoKTogdm9pZCB7XG4gICAgdGhpcy5jb21wdXRlZFRyZWVDb250YWluZXJIZWlnaHQoKTtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRoaXMuZGF0YS5jb2xsYXBzZWQgPSAhdGhpcy5kYXRhLmNvbGxhcHNlZDtcbiAgICB9LCAxMDApO1xuICB9XG5cbiAgY29tcHV0ZWRUcmVlQ29udGFpbmVySGVpZ2h0KCk6IHZvaWQge1xuICAgIGNvbnN0IG5hdGl2ZUVsZW1lbnQ6IEhUTUxFbGVtZW50ID0gdGhpcy50cmVlQ29udGFpbmVyLm5hdGl2ZUVsZW1lbnQ7XG4gICAgaWYgKG5hdGl2ZUVsZW1lbnQgJiYgbmF0aXZlRWxlbWVudC5maXJzdEVsZW1lbnRDaGlsZCkge1xuICAgICAgbmF0aXZlRWxlbWVudC5zdHlsZS5tYXhIZWlnaHQgPSBuYXRpdmVFbGVtZW50LmZpcnN0RWxlbWVudENoaWxkLmNsaWVudEhlaWdodCArIDggKyBcInB4XCI7XG4gICAgfVxuICB9XG5cbiAgY2hhbmdlQ29uZGl0aW9uKHZhbHVlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5kaXNhYmxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuZGF0YS5jb25kaXRpb24gPSB2YWx1ZTtcbiAgICB0aGlzLmhhbmRsZVRvdWNoZWQoKTtcbiAgICB0aGlzLmhhbmRsZURhdGFDaGFuZ2UoKTtcbiAgfVxuXG4gIGNoYW5nZU9wZXJhdG9yKHJ1bGU6IFJ1bGUpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5kaXNhYmxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmNvbmZpZy5jb2VyY2VWYWx1ZUZvck9wZXJhdG9yKSB7XG4gICAgICBydWxlLnZhbHVlID0gdGhpcy5jb25maWcuY29lcmNlVmFsdWVGb3JPcGVyYXRvcihydWxlLm9wZXJhdG9yIGFzIHN0cmluZywgcnVsZS52YWx1ZSwgcnVsZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJ1bGUudmFsdWUgPSB0aGlzLmNvZXJjZVZhbHVlRm9yT3BlcmF0b3IocnVsZS5vcGVyYXRvciBhcyBzdHJpbmcsIHJ1bGUudmFsdWUsIHJ1bGUpO1xuICAgIH1cblxuICAgIHRoaXMuaGFuZGxlVG91Y2hlZCgpO1xuICAgIHRoaXMuaGFuZGxlRGF0YUNoYW5nZSgpO1xuICB9XG5cbiAgY29lcmNlVmFsdWVGb3JPcGVyYXRvcihvcGVyYXRvcjogc3RyaW5nLCB2YWx1ZTogYW55LCBydWxlOiBSdWxlKTogYW55IHtcbiAgICBjb25zdCBpbnB1dFR5cGU6IHN0cmluZyB8IG51bGwgPSB0aGlzLmdldElucHV0VHlwZShydWxlLmZpZWxkLCBvcGVyYXRvcik7XG4gICAgaWYgKGlucHV0VHlwZSA9PT0gXCJtdWx0aXNlbGVjdFwiICYmICFBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgcmV0dXJuIFt2YWx1ZV07XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIGNoYW5nZUlucHV0KCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmRpc2FibGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5oYW5kbGVUb3VjaGVkKCk7XG4gICAgdGhpcy5oYW5kbGVEYXRhQ2hhbmdlKCk7XG4gIH1cblxuICBjaGFuZ2VGaWVsZChmaWVsZFZhbHVlOiBzdHJpbmcsIHJ1bGU6IFJ1bGUpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5kaXNhYmxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGlucHV0Q29udGV4dCA9IHRoaXMuaW5wdXRDb250ZXh0Q2FjaGUuZ2V0KHJ1bGUpO1xuICAgIGNvbnN0IGN1cnJlbnRGaWVsZCA9IGlucHV0Q29udGV4dCAmJiBpbnB1dENvbnRleHQuZmllbGQ7XG5cbiAgICBjb25zdCBuZXh0RmllbGQ6IEZpZWxkID0gdGhpcy5jb25maWcuZmllbGRzW2ZpZWxkVmFsdWVdO1xuXG4gICAgY29uc3QgbmV4dFZhbHVlID0gdGhpcy5jYWxjdWxhdGVGaWVsZENoYW5nZVZhbHVlKGN1cnJlbnRGaWVsZCBhcyBGaWVsZCwgbmV4dEZpZWxkLCBydWxlLnZhbHVlKTtcblxuICAgIGlmIChuZXh0VmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcnVsZS52YWx1ZSA9IG5leHRWYWx1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVsZXRlIHJ1bGUudmFsdWU7XG4gICAgfVxuXG4gICAgcnVsZS5vcGVyYXRvciA9IHRoaXMuZ2V0RGVmYXVsdE9wZXJhdG9yKG5leHRGaWVsZCkgYXMgc3RyaW5nO1xuXG4gICAgLy8gQ3JlYXRlIG5ldyBjb250ZXh0IG9iamVjdHMgc28gdGVtcGxhdGVzIHdpbGwgYXV0b21hdGljYWxseSB1cGRhdGVcbiAgICB0aGlzLmlucHV0Q29udGV4dENhY2hlLmRlbGV0ZShydWxlKTtcbiAgICB0aGlzLm9wZXJhdG9yQ29udGV4dENhY2hlLmRlbGV0ZShydWxlKTtcbiAgICB0aGlzLmZpZWxkQ29udGV4dENhY2hlLmRlbGV0ZShydWxlKTtcbiAgICB0aGlzLmVudGl0eUNvbnRleHRDYWNoZS5kZWxldGUocnVsZSk7XG4gICAgdGhpcy5nZXRJbnB1dENvbnRleHQocnVsZSk7XG4gICAgdGhpcy5nZXRGaWVsZENvbnRleHQocnVsZSk7XG4gICAgdGhpcy5nZXRPcGVyYXRvckNvbnRleHQocnVsZSk7XG4gICAgdGhpcy5nZXRFbnRpdHlDb250ZXh0KHJ1bGUpO1xuXG4gICAgdGhpcy5oYW5kbGVUb3VjaGVkKCk7XG4gICAgdGhpcy5oYW5kbGVEYXRhQ2hhbmdlKCk7XG4gIH1cblxuICBjaGFuZ2VFbnRpdHkoZW50aXR5VmFsdWU6IHN0cmluZywgcnVsZTogUnVsZSwgaW5kZXg6IG51bWJlciwgZGF0YTogUnVsZVNldCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmRpc2FibGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGxldCBpID0gaW5kZXg7XG4gICAgbGV0IHJzID0gZGF0YTtcbiAgICBjb25zdCBlbnRpdHk6IEVudGl0eSA9IHRoaXMuZW50aXRpZXMuZmluZCgoZSkgPT4gZS52YWx1ZSA9PT0gZW50aXR5VmFsdWUpIGFzIEVudGl0eTtcbiAgICBjb25zdCBkZWZhdWx0RmllbGQ6IEZpZWxkID0gdGhpcy5nZXREZWZhdWx0RmllbGQoZW50aXR5KSBhcyBGaWVsZDtcbiAgICBpZiAoIXJzKSB7XG4gICAgICBycyA9IHRoaXMuZGF0YTtcbiAgICAgIGkgPSBycy5ydWxlcy5maW5kSW5kZXgoKHgpID0+IHggPT09IHJ1bGUpO1xuICAgIH1cbiAgICBydWxlLmZpZWxkID0gZGVmYXVsdEZpZWxkLnZhbHVlIGFzIHN0cmluZztcbiAgICBycy5ydWxlc1tpXSA9IHJ1bGU7XG4gICAgaWYgKGRlZmF1bHRGaWVsZCkge1xuICAgICAgdGhpcy5jaGFuZ2VGaWVsZChkZWZhdWx0RmllbGQudmFsdWUgYXMgc3RyaW5nLCBydWxlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5oYW5kbGVUb3VjaGVkKCk7XG4gICAgICB0aGlzLmhhbmRsZURhdGFDaGFuZ2UoKTtcbiAgICB9XG4gIH1cblxuICBnZXREZWZhdWx0VmFsdWUoZGVmYXVsdFZhbHVlOiBhbnkpOiBhbnkge1xuICAgIHN3aXRjaCAodHlwZW9mIGRlZmF1bHRWYWx1ZSkge1xuICAgICAgY2FzZSBcImZ1bmN0aW9uXCI6XG4gICAgICAgIHJldHVybiBkZWZhdWx0VmFsdWUoKTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBkZWZhdWx0VmFsdWU7XG4gICAgfVxuICB9XG5cbiAgZ2V0T3BlcmF0b3JUZW1wbGF0ZSgpOiBUZW1wbGF0ZVJlZjxhbnk+IHwgbnVsbCB7XG4gICAgY29uc3QgdCA9IHRoaXMucGFyZW50T3BlcmF0b3JUZW1wbGF0ZSB8fCB0aGlzLm9wZXJhdG9yVGVtcGxhdGU7XG4gICAgcmV0dXJuIHQgPyB0LnRlbXBsYXRlIDogbnVsbDtcbiAgfVxuXG4gIGdldEZpZWxkVGVtcGxhdGUoKTogVGVtcGxhdGVSZWY8YW55PiB8IG51bGwge1xuICAgIGNvbnN0IHQgPSB0aGlzLnBhcmVudEZpZWxkVGVtcGxhdGUgfHwgdGhpcy5maWVsZFRlbXBsYXRlO1xuICAgIHJldHVybiB0ID8gdC50ZW1wbGF0ZSA6IG51bGw7XG4gIH1cblxuICBnZXRFbnRpdHlUZW1wbGF0ZSgpOiBUZW1wbGF0ZVJlZjxhbnk+IHwgbnVsbCB7XG4gICAgY29uc3QgdCA9IHRoaXMucGFyZW50RW50aXR5VGVtcGxhdGUgfHwgdGhpcy5lbnRpdHlUZW1wbGF0ZTtcbiAgICByZXR1cm4gdCA/IHQudGVtcGxhdGUgOiBudWxsO1xuICB9XG5cbiAgZ2V0QXJyb3dJY29uVGVtcGxhdGUoKTogVGVtcGxhdGVSZWY8YW55PiB8IG51bGwge1xuICAgIGNvbnN0IHQgPSB0aGlzLnBhcmVudEFycm93SWNvblRlbXBsYXRlIHx8IHRoaXMuYXJyb3dJY29uVGVtcGxhdGU7XG4gICAgcmV0dXJuIHQgPyB0LnRlbXBsYXRlIDogbnVsbDtcbiAgfVxuXG4gIGdldEJ1dHRvbkdyb3VwVGVtcGxhdGUoKTogVGVtcGxhdGVSZWY8YW55PiB8IG51bGwge1xuICAgIGNvbnN0IHQgPSB0aGlzLnBhcmVudEJ1dHRvbkdyb3VwVGVtcGxhdGUgfHwgdGhpcy5idXR0b25Hcm91cFRlbXBsYXRlO1xuICAgIHJldHVybiB0ID8gdC50ZW1wbGF0ZSA6IG51bGw7XG4gIH1cblxuICBnZXRTd2l0Y2hHcm91cFRlbXBsYXRlKCk6IFRlbXBsYXRlUmVmPGFueT4gfCBudWxsIHtcbiAgICBjb25zdCB0ID0gdGhpcy5wYXJlbnRTd2l0Y2hHcm91cFRlbXBsYXRlIHx8IHRoaXMuc3dpdGNoR3JvdXBUZW1wbGF0ZTtcbiAgICByZXR1cm4gdCA/IHQudGVtcGxhdGUgOiBudWxsO1xuICB9XG5cbiAgZ2V0UmVtb3ZlQnV0dG9uVGVtcGxhdGUoKTogVGVtcGxhdGVSZWY8YW55PiB8IG51bGwge1xuICAgIGNvbnN0IHQgPSB0aGlzLnBhcmVudFJlbW92ZUJ1dHRvblRlbXBsYXRlIHx8IHRoaXMucmVtb3ZlQnV0dG9uVGVtcGxhdGU7XG4gICAgcmV0dXJuIHQgPyB0LnRlbXBsYXRlIDogbnVsbDtcbiAgfVxuXG4gIGdldEVtcHR5V2FybmluZ1RlbXBsYXRlKCk6IFRlbXBsYXRlUmVmPGFueT4gfCBudWxsIHtcbiAgICBjb25zdCB0ID0gdGhpcy5wYXJlbnRFbXB0eVdhcm5pbmdUZW1wbGF0ZSB8fCB0aGlzLmVtcHR5V2FybmluZ1RlbXBsYXRlO1xuICAgIHJldHVybiB0ID8gdC50ZW1wbGF0ZSA6IG51bGw7XG4gIH1cblxuICBnZXRRdWVyeUl0ZW1DbGFzc05hbWUobG9jYWw6IExvY2FsUnVsZU1ldGEpOiBzdHJpbmcge1xuICAgIGxldCBjbHMgPSB0aGlzLmdldENsYXNzTmFtZXMoXCJyb3dcIiwgXCJjb25uZWN0b3JcIiwgXCJ0cmFuc2l0aW9uXCIpO1xuICAgIGNscyArPSBcIiBcIiArIHRoaXMuZ2V0Q2xhc3NOYW1lcyhsb2NhbC5ydWxlc2V0ID8gXCJydWxlU2V0XCIgOiBcInJ1bGVcIik7XG4gICAgaWYgKGxvY2FsLmludmFsaWQpIHtcbiAgICAgIGNscyArPSBcIiBcIiArIHRoaXMuZ2V0Q2xhc3NOYW1lcyhcImludmFsaWRSdWxlU2V0XCIpO1xuICAgIH1cbiAgICByZXR1cm4gY2xzIGFzIHN0cmluZztcbiAgfVxuXG4gIGdldEJ1dHRvbkdyb3VwQ29udGV4dCgpOiBCdXR0b25Hcm91cENvbnRleHQge1xuICAgIGlmICghdGhpcy5idXR0b25Hcm91cENvbnRleHQpIHtcbiAgICAgIHRoaXMuYnV0dG9uR3JvdXBDb250ZXh0ID0ge1xuICAgICAgICBhZGRSdWxlOiB0aGlzLmFkZFJ1bGUuYmluZCh0aGlzKSxcbiAgICAgICAgYWRkUnVsZVNldDogdGhpcy5hbGxvd1J1bGVzZXQgJiYgKHRoaXMuYWRkUnVsZVNldC5iaW5kKHRoaXMpIGFzIGFueSksXG4gICAgICAgIHJlbW92ZVJ1bGVTZXQ6XG4gICAgICAgICAgdGhpcy5hbGxvd1J1bGVzZXQgJiYgdGhpcy5wYXJlbnRWYWx1ZSAmJiAodGhpcy5yZW1vdmVSdWxlU2V0LmJpbmQodGhpcykgYXMgYW55KSxcbiAgICAgICAgZ2V0RGlzYWJsZWRTdGF0ZTogdGhpcy5nZXREaXNhYmxlZFN0YXRlLFxuICAgICAgICAkaW1wbGljaXQ6IHRoaXMuZGF0YVxuICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuYnV0dG9uR3JvdXBDb250ZXh0O1xuICB9XG5cbiAgZ2V0UmVtb3ZlQnV0dG9uQ29udGV4dChydWxlOiBSdWxlKTogUmVtb3ZlQnV0dG9uQ29udGV4dCB7XG4gICAgaWYgKCF0aGlzLnJlbW92ZUJ1dHRvbkNvbnRleHRDYWNoZS5oYXMocnVsZSkpIHtcbiAgICAgIHRoaXMucmVtb3ZlQnV0dG9uQ29udGV4dENhY2hlLnNldChydWxlLCB7XG4gICAgICAgIHJlbW92ZVJ1bGU6IHRoaXMucmVtb3ZlUnVsZS5iaW5kKHRoaXMpLFxuICAgICAgICBnZXREaXNhYmxlZFN0YXRlOiB0aGlzLmdldERpc2FibGVkU3RhdGUsXG4gICAgICAgICRpbXBsaWNpdDogcnVsZVxuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnJlbW92ZUJ1dHRvbkNvbnRleHRDYWNoZS5nZXQocnVsZSkgYXMgUmVtb3ZlQnV0dG9uQ29udGV4dDtcbiAgfVxuXG4gIGdldEZpZWxkQ29udGV4dChydWxlOiBSdWxlKTogRmllbGRDb250ZXh0IHtcbiAgICBpZiAoIXRoaXMuZmllbGRDb250ZXh0Q2FjaGUuaGFzKHJ1bGUpKSB7XG4gICAgICB0aGlzLmZpZWxkQ29udGV4dENhY2hlLnNldChydWxlLCB7XG4gICAgICAgIG9uQ2hhbmdlOiB0aGlzLmNoYW5nZUZpZWxkLmJpbmQodGhpcyksXG4gICAgICAgIGdldEZpZWxkczogdGhpcy5nZXRGaWVsZHMuYmluZCh0aGlzKSxcbiAgICAgICAgZ2V0RGlzYWJsZWRTdGF0ZTogdGhpcy5nZXREaXNhYmxlZFN0YXRlLFxuICAgICAgICBmaWVsZHM6IHRoaXMuZmllbGRzLFxuICAgICAgICAkaW1wbGljaXQ6IHJ1bGVcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5maWVsZENvbnRleHRDYWNoZS5nZXQocnVsZSkgYXMgRmllbGRDb250ZXh0O1xuICB9XG5cbiAgZ2V0RW50aXR5Q29udGV4dChydWxlOiBSdWxlKTogRW50aXR5Q29udGV4dCB7XG4gICAgaWYgKCF0aGlzLmVudGl0eUNvbnRleHRDYWNoZS5oYXMocnVsZSkpIHtcbiAgICAgIHRoaXMuZW50aXR5Q29udGV4dENhY2hlLnNldChydWxlLCB7XG4gICAgICAgIG9uQ2hhbmdlOiB0aGlzLmNoYW5nZUVudGl0eS5iaW5kKHRoaXMpIGFzIGFueSxcbiAgICAgICAgZ2V0RGlzYWJsZWRTdGF0ZTogdGhpcy5nZXREaXNhYmxlZFN0YXRlLFxuICAgICAgICBlbnRpdGllczogdGhpcy5lbnRpdGllcyxcbiAgICAgICAgJGltcGxpY2l0OiBydWxlXG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZW50aXR5Q29udGV4dENhY2hlLmdldChydWxlKSBhcyBFbnRpdHlDb250ZXh0O1xuICB9XG5cbiAgZ2V0U3dpdGNoR3JvdXBDb250ZXh0KCk6IFN3aXRjaEdyb3VwQ29udGV4dCB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG9uQ2hhbmdlOiB0aGlzLmNoYW5nZUNvbmRpdGlvbi5iaW5kKHRoaXMpLFxuICAgICAgZ2V0RGlzYWJsZWRTdGF0ZTogdGhpcy5nZXREaXNhYmxlZFN0YXRlLFxuICAgICAgJGltcGxpY2l0OiB0aGlzLmRhdGFcbiAgICB9O1xuICB9XG5cbiAgZ2V0QXJyb3dJY29uQ29udGV4dCgpOiBBcnJvd0ljb25Db250ZXh0IHtcbiAgICByZXR1cm4ge1xuICAgICAgZ2V0RGlzYWJsZWRTdGF0ZTogdGhpcy5nZXREaXNhYmxlZFN0YXRlLFxuICAgICAgJGltcGxpY2l0OiB0aGlzLmRhdGFcbiAgICB9O1xuICB9XG5cbiAgZ2V0RW1wdHlXYXJuaW5nQ29udGV4dCgpOiBFbXB0eVdhcm5pbmdDb250ZXh0IHtcbiAgICByZXR1cm4ge1xuICAgICAgZ2V0RGlzYWJsZWRTdGF0ZTogdGhpcy5nZXREaXNhYmxlZFN0YXRlLFxuICAgICAgbWVzc2FnZTogdGhpcy5lbXB0eU1lc3NhZ2UsXG4gICAgICAkaW1wbGljaXQ6IHRoaXMuZGF0YVxuICAgIH07XG4gIH1cblxuICBnZXRPcGVyYXRvckNvbnRleHQocnVsZTogUnVsZSk6IE9wZXJhdG9yQ29udGV4dCB7XG4gICAgaWYgKCF0aGlzLm9wZXJhdG9yQ29udGV4dENhY2hlLmhhcyhydWxlKSkge1xuICAgICAgdGhpcy5vcGVyYXRvckNvbnRleHRDYWNoZS5zZXQocnVsZSwge1xuICAgICAgICBvbkNoYW5nZTogdGhpcy5jaGFuZ2VPcGVyYXRvci5iaW5kKHRoaXMpIGFzIGFueSxcbiAgICAgICAgZ2V0RGlzYWJsZWRTdGF0ZTogdGhpcy5nZXREaXNhYmxlZFN0YXRlLFxuICAgICAgICBvcGVyYXRvcnM6IHRoaXMuZ2V0T3BlcmF0b3JzKHJ1bGUuZmllbGQpLFxuICAgICAgICAkaW1wbGljaXQ6IHJ1bGVcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5vcGVyYXRvckNvbnRleHRDYWNoZS5nZXQocnVsZSkgYXMgT3BlcmF0b3JDb250ZXh0O1xuICB9XG5cbiAgZ2V0SW5wdXRDb250ZXh0KHJ1bGU6IFJ1bGUpOiBJbnB1dENvbnRleHQge1xuICAgIGlmICghdGhpcy5pbnB1dENvbnRleHRDYWNoZS5oYXMocnVsZSkpIHtcbiAgICAgIHRoaXMuaW5wdXRDb250ZXh0Q2FjaGUuc2V0KHJ1bGUsIHtcbiAgICAgICAgb25DaGFuZ2U6IHRoaXMuY2hhbmdlSW5wdXQuYmluZCh0aGlzKSxcbiAgICAgICAgZ2V0RGlzYWJsZWRTdGF0ZTogdGhpcy5nZXREaXNhYmxlZFN0YXRlLFxuICAgICAgICBvcHRpb25zOiB0aGlzLmdldE9wdGlvbnMocnVsZS5maWVsZCksXG4gICAgICAgIGZpZWxkOiB0aGlzLmNvbmZpZy5maWVsZHNbcnVsZS5maWVsZF0sXG4gICAgICAgICRpbXBsaWNpdDogcnVsZVxuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmlucHV0Q29udGV4dENhY2hlLmdldChydWxlKSBhcyBJbnB1dENvbnRleHQ7XG4gIH1cblxuICBwcml2YXRlIGNhbGN1bGF0ZUZpZWxkQ2hhbmdlVmFsdWUoY3VycmVudEZpZWxkOiBGaWVsZCwgbmV4dEZpZWxkOiBGaWVsZCwgY3VycmVudFZhbHVlOiBhbnkpOiBhbnkge1xuICAgIGlmICh0aGlzLmNvbmZpZy5jYWxjdWxhdGVGaWVsZENoYW5nZVZhbHVlICE9IG51bGwpIHtcbiAgICAgIHJldHVybiB0aGlzLmNvbmZpZy5jYWxjdWxhdGVGaWVsZENoYW5nZVZhbHVlKGN1cnJlbnRGaWVsZCwgbmV4dEZpZWxkLCBjdXJyZW50VmFsdWUpO1xuICAgIH1cblxuICAgIGNvbnN0IGNhbktlZXBWYWx1ZSA9ICgpID0+IHtcbiAgICAgIGlmIChjdXJyZW50RmllbGQgPT0gbnVsbCB8fCBuZXh0RmllbGQgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gKFxuICAgICAgICBjdXJyZW50RmllbGQudHlwZSA9PT0gbmV4dEZpZWxkLnR5cGUgJiZcbiAgICAgICAgdGhpcy5kZWZhdWx0UGVyc2lzdFZhbHVlVHlwZXMuaW5kZXhPZihjdXJyZW50RmllbGQudHlwZSkgIT09IC0xXG4gICAgICApO1xuICAgIH07XG5cbiAgICBpZiAodGhpcy5wZXJzaXN0VmFsdWVPbkZpZWxkQ2hhbmdlICYmIGNhbktlZXBWYWx1ZSgpKSB7XG4gICAgICByZXR1cm4gY3VycmVudFZhbHVlO1xuICAgIH1cblxuICAgIGlmIChuZXh0RmllbGQgJiYgbmV4dEZpZWxkLmRlZmF1bHRWYWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpcy5nZXREZWZhdWx0VmFsdWUobmV4dEZpZWxkLmRlZmF1bHRWYWx1ZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIHByaXZhdGUgY2hlY2tFbXB0eVJ1bGVJblJ1bGVzZXQocnVsZXNldDogUnVsZVNldCk6IGJvb2xlYW4ge1xuICAgIGlmICghcnVsZXNldCB8fCAhcnVsZXNldC5ydWxlcyB8fCBydWxlc2V0LnJ1bGVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBydWxlc2V0LnJ1bGVzLnNvbWUoKGl0ZW06IFJ1bGVTZXQgfCBhbnkpID0+IHtcbiAgICAgICAgaWYgKGl0ZW0ucnVsZXMpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5jaGVja0VtcHR5UnVsZUluUnVsZXNldChpdGVtKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgdmFsaWRhdGVSdWxlc0luUnVsZXNldChydWxlc2V0OiBSdWxlU2V0LCBlcnJvclN0b3JlOiBhbnlbXSkge1xuICAgIGlmIChydWxlc2V0ICYmIHJ1bGVzZXQucnVsZXMgJiYgcnVsZXNldC5ydWxlcy5sZW5ndGggPiAwKSB7XG4gICAgICBydWxlc2V0LnJ1bGVzLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgICAgaWYgKChpdGVtIGFzIFJ1bGVTZXQpLnJ1bGVzKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMudmFsaWRhdGVSdWxlc0luUnVsZXNldChpdGVtIGFzIFJ1bGVTZXQsIGVycm9yU3RvcmUpO1xuICAgICAgICB9IGVsc2UgaWYgKChpdGVtIGFzIFJ1bGUpLmZpZWxkKSB7XG4gICAgICAgICAgY29uc3QgZmllbGQgPSB0aGlzLmNvbmZpZy5maWVsZHNbKGl0ZW0gYXMgUnVsZSkuZmllbGRdO1xuICAgICAgICAgIGlmIChmaWVsZCAmJiBmaWVsZC52YWxpZGF0b3IpIHtcbiAgICAgICAgICAgIGNvbnN0IGVycm9yID0gZmllbGQudmFsaWRhdG9yKGl0ZW0gYXMgUnVsZSwgcnVsZXNldCk7XG4gICAgICAgICAgICBpZiAoZXJyb3IgIT0gbnVsbCkge1xuICAgICAgICAgICAgICBlcnJvclN0b3JlLnB1c2goZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBoYW5kbGVEYXRhQ2hhbmdlKCk6IHZvaWQge1xuICAgIHRoaXMuY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCk7XG4gICAgaWYgKHRoaXMub25DaGFuZ2VDYWxsYmFjaykge1xuICAgICAgdGhpcy5vbkNoYW5nZUNhbGxiYWNrKCk7XG4gICAgfVxuICAgIGlmICh0aGlzLnBhcmVudENoYW5nZUNhbGxiYWNrKSB7XG4gICAgICB0aGlzLnBhcmVudENoYW5nZUNhbGxiYWNrKCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBoYW5kbGVUb3VjaGVkKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLm9uVG91Y2hlZENhbGxiYWNrKSB7XG4gICAgICB0aGlzLm9uVG91Y2hlZENhbGxiYWNrKCk7XG4gICAgfVxuICAgIGlmICh0aGlzLnBhcmVudFRvdWNoZWRDYWxsYmFjaykge1xuICAgICAgdGhpcy5wYXJlbnRUb3VjaGVkQ2FsbGJhY2soKTtcbiAgICB9XG4gIH1cbn1cbiIsIjxkaXYgW25nQ2xhc3NdPVwiZ2V0Q2xhc3NOYW1lcygnc3dpdGNoUm93JylcIj5cbiAgPG5nLXRlbXBsYXRlICNkZWZhdWx0QXJyb3dJY29uPlxuICAgIDxpIFtuZ0NsYXNzXT1cImdldENsYXNzTmFtZXMoJ2Fycm93SWNvbicpXCI+PC9pPlxuICA8L25nLXRlbXBsYXRlPlxuXG4gIDxhXG4gICAgKm5nSWY9XCJhbGxvd0NvbGxhcHNlXCJcbiAgICAoY2xpY2spPVwidG9nZ2xlQ29sbGFwc2UoKVwiXG4gICAgW25nQ2xhc3NdPVwiZ2V0Q2xhc3NOYW1lcygnYXJyb3dJY29uQnV0dG9uJywgZGF0YS5jb2xsYXBzZWQgPyAnY29sbGFwc2VkJyA6ICcnKVwiXG4gID5cbiAgICA8bmctY29udGFpbmVyICpuZ0lmPVwiZ2V0QXJyb3dJY29uVGVtcGxhdGUoKSBhcyB0ZW1wbGF0ZTsgZWxzZSBkZWZhdWx0QXJyb3dJY29uXCI+XG4gICAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwidGVtcGxhdGU7IGNvbnRleHQ6IGdldEFycm93SWNvbkNvbnRleHQoKVwiPjwvbmctY29udGFpbmVyPlxuICAgIDwvbmctY29udGFpbmVyPlxuICA8L2E+XG5cbiAgPG5nLWNvbnRhaW5lciAqbmdJZj1cImdldEJ1dHRvbkdyb3VwVGVtcGxhdGUoKSBhcyB0ZW1wbGF0ZTsgZWxzZSBkZWZhdWx0QnV0dG9uR3JvdXBcIj5cbiAgICA8ZGl2IFtuZ0NsYXNzXT1cImdldENsYXNzTmFtZXMoJ2J1dHRvbkdyb3VwJywgJ3JpZ2h0QWxpZ24nKVwiPlxuICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cInRlbXBsYXRlOyBjb250ZXh0OiBnZXRCdXR0b25Hcm91cENvbnRleHQoKVwiPjwvbmctY29udGFpbmVyPlxuICAgIDwvZGl2PlxuICA8L25nLWNvbnRhaW5lcj5cblxuICA8bmctdGVtcGxhdGUgI2RlZmF1bHRCdXR0b25Hcm91cD5cbiAgICA8ZGl2IFtuZ0NsYXNzXT1cImdldENsYXNzTmFtZXMoJ2J1dHRvbkdyb3VwJywgJ3JpZ2h0QWxpZ24nKVwiPlxuICAgICAgPGJ1dHRvblxuICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgKGNsaWNrKT1cImFkZFJ1bGUoKVwiXG4gICAgICAgIFtuZ0NsYXNzXT1cImdldENsYXNzTmFtZXMoJ2J1dHRvbicpXCJcbiAgICAgICAgW2Rpc2FibGVkXT1cImRpc2FibGVkXCJcbiAgICAgID5cbiAgICAgICAgPGkgW25nQ2xhc3NdPVwiZ2V0Q2xhc3NOYW1lcygnYWRkSWNvbicpXCI+PC9pPiBSdWxlXG4gICAgICA8L2J1dHRvbj5cbiAgICAgIDxidXR0b25cbiAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgIChjbGljayk9XCJhZGRSdWxlU2V0KClcIlxuICAgICAgICBbbmdDbGFzc109XCJnZXRDbGFzc05hbWVzKCdidXR0b24nKVwiXG4gICAgICAgICpuZ0lmPVwiYWxsb3dSdWxlc2V0XCJcbiAgICAgICAgW2Rpc2FibGVkXT1cImRpc2FibGVkXCJcbiAgICAgID5cbiAgICAgICAgPGkgW25nQ2xhc3NdPVwiZ2V0Q2xhc3NOYW1lcygnYWRkSWNvbicpXCI+PC9pPiBSdWxlc2V0XG4gICAgICA8L2J1dHRvbj5cbiAgICAgIDxuZy1jb250YWluZXIgKm5nSWY9XCIhIXBhcmVudFZhbHVlICYmIGFsbG93UnVsZXNldFwiPlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgKGNsaWNrKT1cInJlbW92ZVJ1bGVTZXQoKVwiXG4gICAgICAgICAgW25nQ2xhc3NdPVwiZ2V0Q2xhc3NOYW1lcygnYnV0dG9uJywgJ3JlbW92ZUJ1dHRvbicpXCJcbiAgICAgICAgICBbZGlzYWJsZWRdPVwiZGlzYWJsZWRcIlxuICAgICAgICA+XG4gICAgICAgICAgPGkgW25nQ2xhc3NdPVwiZ2V0Q2xhc3NOYW1lcygncmVtb3ZlSWNvbicpXCI+PC9pPlxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvbmctY29udGFpbmVyPlxuICAgIDwvZGl2PlxuICA8L25nLXRlbXBsYXRlPlxuXG4gIDxuZy1jb250YWluZXIgKm5nSWY9XCJnZXRTd2l0Y2hHcm91cFRlbXBsYXRlKCkgYXMgdGVtcGxhdGU7IGVsc2UgZGVmYXVsdFN3aXRjaEdyb3VwXCI+XG4gICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cInRlbXBsYXRlOyBjb250ZXh0OiBnZXRTd2l0Y2hHcm91cENvbnRleHQoKVwiPjwvbmctY29udGFpbmVyPlxuICA8L25nLWNvbnRhaW5lcj5cblxuICA8bmctdGVtcGxhdGUgI2RlZmF1bHRTd2l0Y2hHcm91cD5cbiAgICA8ZGl2IFtuZ0NsYXNzXT1cImdldENsYXNzTmFtZXMoJ3N3aXRjaEdyb3VwJywgJ3RyYW5zaXRpb24nKVwiICpuZ0lmPVwiZGF0YVwiPlxuICAgICAgPGRpdiBbbmdDbGFzc109XCJnZXRDbGFzc05hbWVzKCdzd2l0Y2hDb250cm9sJylcIj5cbiAgICAgICAgPGlucHV0XG4gICAgICAgICAgdHlwZT1cInJhZGlvXCJcbiAgICAgICAgICBbbmdDbGFzc109XCJnZXRDbGFzc05hbWVzKCdzd2l0Y2hSYWRpbycpXCJcbiAgICAgICAgICBbKG5nTW9kZWwpXT1cImRhdGEuY29uZGl0aW9uXCJcbiAgICAgICAgICBbZGlzYWJsZWRdPVwiZGlzYWJsZWRcIlxuICAgICAgICAgIHZhbHVlPVwiYW5kXCJcbiAgICAgICAgICAjYW5kT3B0aW9uXG4gICAgICAgIC8+XG4gICAgICAgIDxsYWJlbCAoY2xpY2spPVwiY2hhbmdlQ29uZGl0aW9uKGFuZE9wdGlvbi52YWx1ZSlcIiBbbmdDbGFzc109XCJnZXRDbGFzc05hbWVzKCdzd2l0Y2hMYWJlbCcpXCJcbiAgICAgICAgICA+QU5EPC9sYWJlbFxuICAgICAgICA+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgW25nQ2xhc3NdPVwiZ2V0Q2xhc3NOYW1lcygnc3dpdGNoQ29udHJvbCcpXCI+XG4gICAgICAgIDxpbnB1dFxuICAgICAgICAgIHR5cGU9XCJyYWRpb1wiXG4gICAgICAgICAgW25nQ2xhc3NdPVwiZ2V0Q2xhc3NOYW1lcygnc3dpdGNoUmFkaW8nKVwiXG4gICAgICAgICAgWyhuZ01vZGVsKV09XCJkYXRhLmNvbmRpdGlvblwiXG4gICAgICAgICAgW2Rpc2FibGVkXT1cImRpc2FibGVkXCJcbiAgICAgICAgICB2YWx1ZT1cIm9yXCJcbiAgICAgICAgICAjb3JPcHRpb25cbiAgICAgICAgLz5cbiAgICAgICAgPGxhYmVsIChjbGljayk9XCJjaGFuZ2VDb25kaXRpb24ob3JPcHRpb24udmFsdWUpXCIgW25nQ2xhc3NdPVwiZ2V0Q2xhc3NOYW1lcygnc3dpdGNoTGFiZWwnKVwiXG4gICAgICAgICAgPk9SPC9sYWJlbFxuICAgICAgICA+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgPC9uZy10ZW1wbGF0ZT5cbjwvZGl2PlxuXG48ZGl2XG4gICN0cmVlQ29udGFpbmVyXG4gICh0cmFuc2l0aW9uZW5kKT1cInRyYW5zaXRpb25FbmQoJGV2ZW50KVwiXG4gIFtuZ0NsYXNzXT1cImdldENsYXNzTmFtZXMoJ3RyZWVDb250YWluZXInLCBkYXRhLmNvbGxhcHNlZCA/ICdjb2xsYXBzZWQnIDogJycpXCJcbj5cbiAgPHVsIFtuZ0NsYXNzXT1cImdldENsYXNzTmFtZXMoJ3RyZWUnKVwiICpuZ0lmPVwiZGF0YSAmJiBkYXRhLnJ1bGVzXCI+XG4gICAgPG5nLWNvbnRhaW5lciAqbmdGb3I9XCJsZXQgcnVsZSBvZiBkYXRhLnJ1bGVzOyBsZXQgaSA9IGluZGV4XCI+XG4gICAgICA8bmctY29udGFpbmVyXG4gICAgICAgICpuZ0lmPVwie1xuICAgICAgICAgIHJ1bGVzZXQ6ICEhcnVsZS5ydWxlcyxcbiAgICAgICAgICBpbnZhbGlkOiAhY29uZmlnLmFsbG93RW1wdHlSdWxlc2V0cyAmJiBydWxlLnJ1bGVzICYmIHJ1bGUucnVsZXMubGVuZ3RoID09PSAwXG4gICAgICAgIH0gYXMgbG9jYWxcIlxuICAgICAgPlxuICAgICAgICA8bGkgW25nQ2xhc3NdPVwiZ2V0UXVlcnlJdGVtQ2xhc3NOYW1lKGxvY2FsKVwiPlxuICAgICAgICAgIDxuZy1jb250YWluZXIgKm5nSWY9XCIhbG9jYWwucnVsZXNldFwiPlxuICAgICAgICAgICAgPG5nLWNvbnRhaW5lciAqbmdJZj1cImdldFJlbW92ZUJ1dHRvblRlbXBsYXRlKCkgYXMgdGVtcGxhdGU7IGVsc2UgZGVmYXVsdFJlbW92ZUJ1dHRvblwiPlxuICAgICAgICAgICAgICA8ZGl2IFtuZ0NsYXNzXT1cImdldENsYXNzTmFtZXMoJ2J1dHRvbkdyb3VwJywgJ3JpZ2h0QWxpZ24nKVwiPlxuICAgICAgICAgICAgICAgIDxuZy1jb250YWluZXJcbiAgICAgICAgICAgICAgICAgICpuZ1RlbXBsYXRlT3V0bGV0PVwidGVtcGxhdGU7IGNvbnRleHQ6IGdldFJlbW92ZUJ1dHRvbkNvbnRleHQocnVsZSlcIlxuICAgICAgICAgICAgICAgID48L25nLWNvbnRhaW5lcj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L25nLWNvbnRhaW5lcj5cblxuICAgICAgICAgICAgPG5nLXRlbXBsYXRlICNkZWZhdWx0UmVtb3ZlQnV0dG9uPlxuICAgICAgICAgICAgICA8ZGl2IFtuZ0NsYXNzXT1cImdldENsYXNzTmFtZXMoJ3JlbW92ZUJ1dHRvblNpemUnLCAncmlnaHRBbGlnbicpXCI+XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICBbbmdDbGFzc109XCJnZXRDbGFzc05hbWVzKCdidXR0b24nLCAncmVtb3ZlQnV0dG9uJylcIlxuICAgICAgICAgICAgICAgICAgKGNsaWNrKT1cInJlbW92ZVJ1bGUocnVsZSwgZGF0YSlcIlxuICAgICAgICAgICAgICAgICAgW2Rpc2FibGVkXT1cImRpc2FibGVkXCJcbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICA8aSBbbmdDbGFzc109XCJnZXRDbGFzc05hbWVzKCdyZW1vdmVJY29uJylcIj48L2k+XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9uZy10ZW1wbGF0ZT5cblxuICAgICAgICAgICAgPGRpdiAqbmdJZj1cImVudGl0aWVzPy5sZW5ndGhcIiBjbGFzcz1cInEtaW5saW5lLWJsb2NrLWRpc3BsYXlcIj5cbiAgICAgICAgICAgICAgPG5nLWNvbnRhaW5lciAqbmdJZj1cImdldEVudGl0eVRlbXBsYXRlKCkgYXMgdGVtcGxhdGU7IGVsc2UgZGVmYXVsdEVudGl0eVwiPlxuICAgICAgICAgICAgICAgIDxuZy1jb250YWluZXJcbiAgICAgICAgICAgICAgICAgICpuZ1RlbXBsYXRlT3V0bGV0PVwidGVtcGxhdGU7IGNvbnRleHQ6IGdldEVudGl0eUNvbnRleHQocnVsZSlcIlxuICAgICAgICAgICAgICAgID48L25nLWNvbnRhaW5lcj5cbiAgICAgICAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgPG5nLXRlbXBsYXRlICNkZWZhdWx0RW50aXR5PlxuICAgICAgICAgICAgICA8ZGl2IFtuZ0NsYXNzXT1cImdldENsYXNzTmFtZXMoJ2VudGl0eUNvbnRyb2xTaXplJylcIj5cbiAgICAgICAgICAgICAgICA8c2VsZWN0XG4gICAgICAgICAgICAgICAgICBbbmdDbGFzc109XCJnZXRDbGFzc05hbWVzKCdlbnRpdHlDb250cm9sJylcIlxuICAgICAgICAgICAgICAgICAgWyhuZ01vZGVsKV09XCJydWxlLmVudGl0eVwiXG4gICAgICAgICAgICAgICAgICAobmdNb2RlbENoYW5nZSk9XCJjaGFuZ2VFbnRpdHkoJGV2ZW50LCBydWxlLCBpLCBkYXRhKVwiXG4gICAgICAgICAgICAgICAgICBbZGlzYWJsZWRdPVwiZGlzYWJsZWRcIlxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgIDxvcHRpb24gKm5nRm9yPVwibGV0IGVudGl0eSBvZiBlbnRpdGllc1wiIFtuZ1ZhbHVlXT1cImVudGl0eS52YWx1ZVwiPlxuICAgICAgICAgICAgICAgICAgICB7eyBlbnRpdHkubmFtZSB9fVxuICAgICAgICAgICAgICAgICAgPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9uZy10ZW1wbGF0ZT5cblxuICAgICAgICAgICAgPG5nLWNvbnRhaW5lciAqbmdJZj1cImdldEZpZWxkVGVtcGxhdGUoKSBhcyB0ZW1wbGF0ZTsgZWxzZSBkZWZhdWx0RmllbGRcIj5cbiAgICAgICAgICAgICAgPG5nLWNvbnRhaW5lclxuICAgICAgICAgICAgICAgICpuZ1RlbXBsYXRlT3V0bGV0PVwidGVtcGxhdGU7IGNvbnRleHQ6IGdldEZpZWxkQ29udGV4dChydWxlKVwiXG4gICAgICAgICAgICAgID48L25nLWNvbnRhaW5lcj5cbiAgICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuXG4gICAgICAgICAgICA8bmctdGVtcGxhdGUgI2RlZmF1bHRGaWVsZD5cbiAgICAgICAgICAgICAgPGRpdiBbbmdDbGFzc109XCJnZXRDbGFzc05hbWVzKCdmaWVsZENvbnRyb2xTaXplJylcIj5cbiAgICAgICAgICAgICAgICA8c2VsZWN0XG4gICAgICAgICAgICAgICAgICBbbmdDbGFzc109XCJnZXRDbGFzc05hbWVzKCdmaWVsZENvbnRyb2wnKVwiXG4gICAgICAgICAgICAgICAgICBbKG5nTW9kZWwpXT1cInJ1bGUuZmllbGRcIlxuICAgICAgICAgICAgICAgICAgKG5nTW9kZWxDaGFuZ2UpPVwiY2hhbmdlRmllbGQoJGV2ZW50LCBydWxlKVwiXG4gICAgICAgICAgICAgICAgICBbZGlzYWJsZWRdPVwiZGlzYWJsZWRcIlxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgIDxvcHRpb24gKm5nRm9yPVwibGV0IGZpZWxkIG9mIGdldEZpZWxkcyhydWxlLmVudGl0eSlcIiBbbmdWYWx1ZV09XCJmaWVsZC52YWx1ZVwiPlxuICAgICAgICAgICAgICAgICAgICB7eyBmaWVsZC5uYW1lIH19XG4gICAgICAgICAgICAgICAgICA8L29wdGlvbj5cbiAgICAgICAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L25nLXRlbXBsYXRlPlxuXG4gICAgICAgICAgICA8bmctY29udGFpbmVyICpuZ0lmPVwiZ2V0T3BlcmF0b3JUZW1wbGF0ZSgpIGFzIHRlbXBsYXRlOyBlbHNlIGRlZmF1bHRPcGVyYXRvclwiPlxuICAgICAgICAgICAgICA8bmctY29udGFpbmVyXG4gICAgICAgICAgICAgICAgKm5nVGVtcGxhdGVPdXRsZXQ9XCJ0ZW1wbGF0ZTsgY29udGV4dDogZ2V0T3BlcmF0b3JDb250ZXh0KHJ1bGUpXCJcbiAgICAgICAgICAgICAgPjwvbmctY29udGFpbmVyPlxuICAgICAgICAgICAgPC9uZy1jb250YWluZXI+XG5cbiAgICAgICAgICAgIDxuZy10ZW1wbGF0ZSAjZGVmYXVsdE9wZXJhdG9yPlxuICAgICAgICAgICAgICA8ZGl2IFtuZ0NsYXNzXT1cImdldENsYXNzTmFtZXMoJ29wZXJhdG9yQ29udHJvbFNpemUnKVwiPlxuICAgICAgICAgICAgICAgIDxzZWxlY3RcbiAgICAgICAgICAgICAgICAgIFtuZ0NsYXNzXT1cImdldENsYXNzTmFtZXMoJ29wZXJhdG9yQ29udHJvbCcpXCJcbiAgICAgICAgICAgICAgICAgIFsobmdNb2RlbCldPVwicnVsZS5vcGVyYXRvclwiXG4gICAgICAgICAgICAgICAgICAobmdNb2RlbENoYW5nZSk9XCJjaGFuZ2VPcGVyYXRvcihydWxlKVwiXG4gICAgICAgICAgICAgICAgICBbZGlzYWJsZWRdPVwiZGlzYWJsZWRcIlxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgIDxvcHRpb24gKm5nRm9yPVwibGV0IG9wZXJhdG9yIG9mIGdldE9wZXJhdG9ycyhydWxlLmZpZWxkKVwiIFtuZ1ZhbHVlXT1cIm9wZXJhdG9yXCI+XG4gICAgICAgICAgICAgICAgICAgIHt7IG9wZXJhdG9yIH19XG4gICAgICAgICAgICAgICAgICA8L29wdGlvbj5cbiAgICAgICAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L25nLXRlbXBsYXRlPlxuXG4gICAgICAgICAgICA8bmctY29udGFpbmVyICpuZ0lmPVwiZmluZFRlbXBsYXRlRm9yUnVsZShydWxlKSBhcyB0ZW1wbGF0ZTsgZWxzZSBkZWZhdWx0SW5wdXRcIj5cbiAgICAgICAgICAgICAgPG5nLWNvbnRhaW5lclxuICAgICAgICAgICAgICAgICpuZ1RlbXBsYXRlT3V0bGV0PVwidGVtcGxhdGU7IGNvbnRleHQ6IGdldElucHV0Q29udGV4dChydWxlKVwiXG4gICAgICAgICAgICAgID48L25nLWNvbnRhaW5lcj5cbiAgICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuXG4gICAgICAgICAgICA8bmctdGVtcGxhdGUgI2RlZmF1bHRJbnB1dD5cbiAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIFtuZ0NsYXNzXT1cImdldENsYXNzTmFtZXMoJ2lucHV0Q29udHJvbFNpemUnKVwiXG4gICAgICAgICAgICAgICAgW25nU3dpdGNoXT1cImdldElucHV0VHlwZShydWxlLmZpZWxkLCBydWxlLm9wZXJhdG9yKVwiXG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgIFtuZ0NsYXNzXT1cImdldENsYXNzTmFtZXMoJ2lucHV0Q29udHJvbCcpXCJcbiAgICAgICAgICAgICAgICAgIFsobmdNb2RlbCldPVwicnVsZS52YWx1ZVwiXG4gICAgICAgICAgICAgICAgICAobmdNb2RlbENoYW5nZSk9XCJjaGFuZ2VJbnB1dCgpXCJcbiAgICAgICAgICAgICAgICAgIFtkaXNhYmxlZF09XCJkaXNhYmxlZFwiXG4gICAgICAgICAgICAgICAgICAqbmdTd2l0Y2hDYXNlPVwiJ3N0cmluZydcIlxuICAgICAgICAgICAgICAgICAgdHlwZT1cInRleHRcIlxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICBbbmdDbGFzc109XCJnZXRDbGFzc05hbWVzKCdpbnB1dENvbnRyb2wnKVwiXG4gICAgICAgICAgICAgICAgICBbKG5nTW9kZWwpXT1cInJ1bGUudmFsdWVcIlxuICAgICAgICAgICAgICAgICAgKG5nTW9kZWxDaGFuZ2UpPVwiY2hhbmdlSW5wdXQoKVwiXG4gICAgICAgICAgICAgICAgICBbZGlzYWJsZWRdPVwiZGlzYWJsZWRcIlxuICAgICAgICAgICAgICAgICAgKm5nU3dpdGNoQ2FzZT1cIidudW1iZXInXCJcbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJudW1iZXJcIlxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICBbbmdDbGFzc109XCJnZXRDbGFzc05hbWVzKCdpbnB1dENvbnRyb2wnKVwiXG4gICAgICAgICAgICAgICAgICBbKG5nTW9kZWwpXT1cInJ1bGUudmFsdWVcIlxuICAgICAgICAgICAgICAgICAgKG5nTW9kZWxDaGFuZ2UpPVwiY2hhbmdlSW5wdXQoKVwiXG4gICAgICAgICAgICAgICAgICBbZGlzYWJsZWRdPVwiZGlzYWJsZWRcIlxuICAgICAgICAgICAgICAgICAgKm5nU3dpdGNoQ2FzZT1cIidkYXRlJ1wiXG4gICAgICAgICAgICAgICAgICB0eXBlPVwiZGF0ZVwiXG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgIFtuZ0NsYXNzXT1cImdldENsYXNzTmFtZXMoJ2lucHV0Q29udHJvbCcpXCJcbiAgICAgICAgICAgICAgICAgIFsobmdNb2RlbCldPVwicnVsZS52YWx1ZVwiXG4gICAgICAgICAgICAgICAgICAobmdNb2RlbENoYW5nZSk9XCJjaGFuZ2VJbnB1dCgpXCJcbiAgICAgICAgICAgICAgICAgIFtkaXNhYmxlZF09XCJkaXNhYmxlZFwiXG4gICAgICAgICAgICAgICAgICAqbmdTd2l0Y2hDYXNlPVwiJ3RpbWUnXCJcbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0aW1lXCJcbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIDxzZWxlY3RcbiAgICAgICAgICAgICAgICAgIFtuZ0NsYXNzXT1cImdldENsYXNzTmFtZXMoJ2lucHV0Q29udHJvbCcpXCJcbiAgICAgICAgICAgICAgICAgIFsobmdNb2RlbCldPVwicnVsZS52YWx1ZVwiXG4gICAgICAgICAgICAgICAgICAobmdNb2RlbENoYW5nZSk9XCJjaGFuZ2VJbnB1dCgpXCJcbiAgICAgICAgICAgICAgICAgIFtkaXNhYmxlZF09XCJkaXNhYmxlZFwiXG4gICAgICAgICAgICAgICAgICAqbmdTd2l0Y2hDYXNlPVwiJ2NhdGVnb3J5J1wiXG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgPG9wdGlvbiAqbmdGb3I9XCJsZXQgb3B0IG9mIGdldE9wdGlvbnMocnVsZS5maWVsZClcIiBbbmdWYWx1ZV09XCJvcHQudmFsdWVcIj5cbiAgICAgICAgICAgICAgICAgICAge3sgb3B0Lm5hbWUgfX1cbiAgICAgICAgICAgICAgICAgIDwvb3B0aW9uPlxuICAgICAgICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICAgICAgICAgIDxuZy1jb250YWluZXIgKm5nU3dpdGNoQ2FzZT1cIidtdWx0aXNlbGVjdCdcIj5cbiAgICAgICAgICAgICAgICAgIDxzZWxlY3RcbiAgICAgICAgICAgICAgICAgICAgW25nQ2xhc3NdPVwiZ2V0Q2xhc3NOYW1lcygnaW5wdXRDb250cm9sJylcIlxuICAgICAgICAgICAgICAgICAgICBbKG5nTW9kZWwpXT1cInJ1bGUudmFsdWVcIlxuICAgICAgICAgICAgICAgICAgICAobmdNb2RlbENoYW5nZSk9XCJjaGFuZ2VJbnB1dCgpXCJcbiAgICAgICAgICAgICAgICAgICAgW2Rpc2FibGVkXT1cImRpc2FibGVkXCJcbiAgICAgICAgICAgICAgICAgICAgbXVsdGlwbGVcbiAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiAqbmdGb3I9XCJsZXQgb3B0IG9mIGdldE9wdGlvbnMocnVsZS5maWVsZClcIiBbbmdWYWx1ZV09XCJvcHQudmFsdWVcIj5cbiAgICAgICAgICAgICAgICAgICAgICB7eyBvcHQubmFtZSB9fVxuICAgICAgICAgICAgICAgICAgICA8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgW25nQ2xhc3NdPVwiZ2V0Q2xhc3NOYW1lcygnaW5wdXRDb250cm9sJylcIlxuICAgICAgICAgICAgICAgICAgWyhuZ01vZGVsKV09XCJydWxlLnZhbHVlXCJcbiAgICAgICAgICAgICAgICAgIChuZ01vZGVsQ2hhbmdlKT1cImNoYW5nZUlucHV0KClcIlxuICAgICAgICAgICAgICAgICAgW2Rpc2FibGVkXT1cImRpc2FibGVkXCJcbiAgICAgICAgICAgICAgICAgICpuZ1N3aXRjaENhc2U9XCInYm9vbGVhbidcIlxuICAgICAgICAgICAgICAgICAgdHlwZT1cImNoZWNrYm94XCJcbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICAgICAgPHF1ZXJ5LWJ1aWxkZXJcbiAgICAgICAgICAgICpuZ0lmPVwibG9jYWwucnVsZXNldFwiXG4gICAgICAgICAgICBbZGF0YV09XCJydWxlXCJcbiAgICAgICAgICAgIFtkaXNhYmxlZF09XCJkaXNhYmxlZFwiXG4gICAgICAgICAgICBbcGFyZW50VG91Y2hlZENhbGxiYWNrXT1cInBhcmVudFRvdWNoZWRDYWxsYmFjayB8fCBvblRvdWNoZWRDYWxsYmFja1wiXG4gICAgICAgICAgICBbcGFyZW50Q2hhbmdlQ2FsbGJhY2tdPVwicGFyZW50Q2hhbmdlQ2FsbGJhY2sgfHwgb25DaGFuZ2VDYWxsYmFja1wiXG4gICAgICAgICAgICBbcGFyZW50SW5wdXRUZW1wbGF0ZXNdPVwicGFyZW50SW5wdXRUZW1wbGF0ZXMgfHwgaW5wdXRUZW1wbGF0ZXNcIlxuICAgICAgICAgICAgW3BhcmVudE9wZXJhdG9yVGVtcGxhdGVdPVwicGFyZW50T3BlcmF0b3JUZW1wbGF0ZSB8fCBvcGVyYXRvclRlbXBsYXRlXCJcbiAgICAgICAgICAgIFtwYXJlbnRGaWVsZFRlbXBsYXRlXT1cInBhcmVudEZpZWxkVGVtcGxhdGUgfHwgZmllbGRUZW1wbGF0ZVwiXG4gICAgICAgICAgICBbcGFyZW50RW50aXR5VGVtcGxhdGVdPVwicGFyZW50RW50aXR5VGVtcGxhdGUgfHwgZW50aXR5VGVtcGxhdGVcIlxuICAgICAgICAgICAgW3BhcmVudFN3aXRjaEdyb3VwVGVtcGxhdGVdPVwicGFyZW50U3dpdGNoR3JvdXBUZW1wbGF0ZSB8fCBzd2l0Y2hHcm91cFRlbXBsYXRlXCJcbiAgICAgICAgICAgIFtwYXJlbnRCdXR0b25Hcm91cFRlbXBsYXRlXT1cInBhcmVudEJ1dHRvbkdyb3VwVGVtcGxhdGUgfHwgYnV0dG9uR3JvdXBUZW1wbGF0ZVwiXG4gICAgICAgICAgICBbcGFyZW50UmVtb3ZlQnV0dG9uVGVtcGxhdGVdPVwicGFyZW50UmVtb3ZlQnV0dG9uVGVtcGxhdGUgfHwgcmVtb3ZlQnV0dG9uVGVtcGxhdGVcIlxuICAgICAgICAgICAgW3BhcmVudEVtcHR5V2FybmluZ1RlbXBsYXRlXT1cInBhcmVudEVtcHR5V2FybmluZ1RlbXBsYXRlIHx8IGVtcHR5V2FybmluZ1RlbXBsYXRlXCJcbiAgICAgICAgICAgIFtwYXJlbnRBcnJvd0ljb25UZW1wbGF0ZV09XCJwYXJlbnRBcnJvd0ljb25UZW1wbGF0ZSB8fCBhcnJvd0ljb25UZW1wbGF0ZVwiXG4gICAgICAgICAgICBbcGFyZW50VmFsdWVdPVwiZGF0YVwiXG4gICAgICAgICAgICBbY2xhc3NOYW1lc109XCJjbGFzc05hbWVzXCJcbiAgICAgICAgICAgIFtjb25maWddPVwiY29uZmlnXCJcbiAgICAgICAgICAgIFthbGxvd1J1bGVzZXRdPVwiYWxsb3dSdWxlc2V0XCJcbiAgICAgICAgICAgIFthbGxvd0NvbGxhcHNlXT1cImFsbG93Q29sbGFwc2VcIlxuICAgICAgICAgICAgW2VtcHR5TWVzc2FnZV09XCJlbXB0eU1lc3NhZ2VcIlxuICAgICAgICAgICAgW29wZXJhdG9yTWFwXT1cIm9wZXJhdG9yTWFwXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgPC9xdWVyeS1idWlsZGVyPlxuXG4gICAgICAgICAgPG5nLWNvbnRhaW5lciAqbmdJZj1cImdldEVtcHR5V2FybmluZ1RlbXBsYXRlKCkgYXMgdGVtcGxhdGU7IGVsc2UgZGVmYXVsdEVtcHR5V2FybmluZ1wiPlxuICAgICAgICAgICAgPG5nLWNvbnRhaW5lciAqbmdJZj1cImxvY2FsLmludmFsaWRcIj5cbiAgICAgICAgICAgICAgPG5nLWNvbnRhaW5lclxuICAgICAgICAgICAgICAgICpuZ1RlbXBsYXRlT3V0bGV0PVwidGVtcGxhdGU7IGNvbnRleHQ6IGdldEVtcHR5V2FybmluZ0NvbnRleHQoKVwiXG4gICAgICAgICAgICAgID48L25nLWNvbnRhaW5lcj5cbiAgICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuXG4gICAgICAgICAgPG5nLXRlbXBsYXRlICNkZWZhdWx0RW1wdHlXYXJuaW5nPlxuICAgICAgICAgICAgPHAgW25nQ2xhc3NdPVwiZ2V0Q2xhc3NOYW1lcygnZW1wdHlXYXJuaW5nJylcIiAqbmdJZj1cImxvY2FsLmludmFsaWRcIj5cbiAgICAgICAgICAgICAge3sgZW1wdHlNZXNzYWdlIH19XG4gICAgICAgICAgICA8L3A+XG4gICAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgPC9saT5cbiAgICAgIDwvbmctY29udGFpbmVyPlxuICAgIDwvbmctY29udGFpbmVyPlxuICA8L3VsPlxuPC9kaXY+XG4iXX0=