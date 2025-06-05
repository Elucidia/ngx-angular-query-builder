import { __decorate } from "tslib";
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
let QueryBuilderComponent = class QueryBuilderComponent {
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
};
__decorate([
    Input()
], QueryBuilderComponent.prototype, "disabled", void 0);
__decorate([
    Input()
], QueryBuilderComponent.prototype, "data", void 0);
__decorate([
    HostBinding("attr.query-builder-condition")
], QueryBuilderComponent.prototype, "condition", null);
__decorate([
    Input()
], QueryBuilderComponent.prototype, "allowRuleset", void 0);
__decorate([
    Input()
], QueryBuilderComponent.prototype, "allowCollapse", void 0);
__decorate([
    Input()
], QueryBuilderComponent.prototype, "emptyMessage", void 0);
__decorate([
    Input()
], QueryBuilderComponent.prototype, "classNames", void 0);
__decorate([
    Input()
], QueryBuilderComponent.prototype, "operatorMap", void 0);
__decorate([
    Input()
], QueryBuilderComponent.prototype, "parentValue", void 0);
__decorate([
    Input()
], QueryBuilderComponent.prototype, "config", void 0);
__decorate([
    Input()
], QueryBuilderComponent.prototype, "parentArrowIconTemplate", void 0);
__decorate([
    Input()
], QueryBuilderComponent.prototype, "parentInputTemplates", void 0);
__decorate([
    Input()
], QueryBuilderComponent.prototype, "parentOperatorTemplate", void 0);
__decorate([
    Input()
], QueryBuilderComponent.prototype, "parentFieldTemplate", void 0);
__decorate([
    Input()
], QueryBuilderComponent.prototype, "parentEntityTemplate", void 0);
__decorate([
    Input()
], QueryBuilderComponent.prototype, "parentSwitchGroupTemplate", void 0);
__decorate([
    Input()
], QueryBuilderComponent.prototype, "parentButtonGroupTemplate", void 0);
__decorate([
    Input()
], QueryBuilderComponent.prototype, "parentRemoveButtonTemplate", void 0);
__decorate([
    Input()
], QueryBuilderComponent.prototype, "parentEmptyWarningTemplate", void 0);
__decorate([
    Input()
], QueryBuilderComponent.prototype, "parentChangeCallback", void 0);
__decorate([
    Input()
], QueryBuilderComponent.prototype, "parentTouchedCallback", void 0);
__decorate([
    Input()
], QueryBuilderComponent.prototype, "persistValueOnFieldChange", void 0);
__decorate([
    ViewChild("treeContainer", { static: true })
], QueryBuilderComponent.prototype, "treeContainer", void 0);
__decorate([
    ContentChild(QueryButtonGroupDirective)
], QueryBuilderComponent.prototype, "buttonGroupTemplate", void 0);
__decorate([
    ContentChild(QuerySwitchGroupDirective)
], QueryBuilderComponent.prototype, "switchGroupTemplate", void 0);
__decorate([
    ContentChild(QueryFieldDirective)
], QueryBuilderComponent.prototype, "fieldTemplate", void 0);
__decorate([
    ContentChild(QueryEntityDirective)
], QueryBuilderComponent.prototype, "entityTemplate", void 0);
__decorate([
    ContentChild(QueryOperatorDirective)
], QueryBuilderComponent.prototype, "operatorTemplate", void 0);
__decorate([
    ContentChild(QueryRemoveButtonDirective)
], QueryBuilderComponent.prototype, "removeButtonTemplate", void 0);
__decorate([
    ContentChild(QueryEmptyWarningDirective)
], QueryBuilderComponent.prototype, "emptyWarningTemplate", void 0);
__decorate([
    ContentChildren(QueryInputDirective, { descendants: true })
], QueryBuilderComponent.prototype, "inputTemplates", void 0);
__decorate([
    ContentChild(QueryArrowIconDirective)
], QueryBuilderComponent.prototype, "arrowIconTemplate", void 0);
__decorate([
    Input()
], QueryBuilderComponent.prototype, "value", null);
QueryBuilderComponent = __decorate([
    Component({
        selector: "query-builder",
        templateUrl: "./query-builder.component.html",
        styleUrls: ["./query-builder.component.scss"],
        providers: [CONTROL_VALUE_ACCESSOR, VALIDATOR]
    })
], QueryBuilderComponent);
export { QueryBuilderComponent };
//# sourceMappingURL=query-builder.component.js.map