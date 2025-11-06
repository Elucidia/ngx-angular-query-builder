import * as i12 from '@angular/forms';
import { ControlValueAccessor, Validator, AbstractControl, ValidationErrors } from '@angular/forms';
import * as i0 from '@angular/core';
import { TemplateRef, OnChanges, QueryList, ElementRef, ChangeDetectorRef, SimpleChanges } from '@angular/core';
import * as i11 from '@angular/common';

interface RuleSet {
    condition: string;
    rules: Array<RuleSet | Rule | any>;
    collapsed?: boolean;
    isChild?: boolean;
}
interface Rule {
    field: string;
    value?: any;
    operator?: string;
    entity?: string;
}
interface Option {
    name: string;
    value: any;
}
interface FieldMap {
    [key: string]: Field;
}
interface Field {
    name: string;
    value?: string;
    type: string;
    nullable?: boolean;
    options?: Option[];
    operators?: string[];
    defaultValue?: any;
    defaultOperator?: any;
    entity?: string;
    validator?: (rule: Rule, parent: RuleSet) => any | null;
}
interface LocalRuleMeta {
    ruleset: boolean;
    invalid: boolean;
}
interface EntityMap {
    [key: string]: Entity;
}
interface Entity {
    name: string;
    value?: string;
    defaultField?: any;
}
interface QueryBuilderClassNames {
    arrowIconButton?: string;
    arrowIcon?: string;
    removeIcon?: string;
    addIcon?: string;
    button?: string;
    buttonGroup?: string;
    removeButton?: string;
    removeButtonSize?: string;
    switchRow?: string;
    switchGroup?: string;
    switchLabel?: string;
    switchRadio?: string;
    switchControl?: string;
    rightAlign?: string;
    transition?: string;
    collapsed?: string;
    treeContainer?: string;
    tree?: string;
    row?: string;
    connector?: string;
    rule?: string;
    ruleSet?: string;
    invalidRuleSet?: string;
    emptyWarning?: string;
    fieldControl?: string;
    fieldControlSize?: string;
    entityControl?: string;
    entityControlSize?: string;
    operatorControl?: string;
    operatorControlSize?: string;
    inputControl?: string;
    inputControlSize?: string;
}
interface QueryBuilderConfig {
    fields: FieldMap;
    entities?: EntityMap;
    allowEmptyRulesets?: boolean;
    getOperators?: (fieldName: string, field: Field) => string[];
    getInputType?: (field: string, operator: string) => string;
    getOptions?: (field: string) => Option[];
    addRuleSet?: (parent: RuleSet) => void;
    addRule?: (parent: RuleSet) => void;
    removeRuleSet?: (ruleset: RuleSet, parent?: RuleSet) => void;
    removeRule?: (rule: Rule, parent: RuleSet) => void;
    coerceValueForOperator?: (operator: string, value: any, rule: Rule) => any;
    calculateFieldChangeValue?: (currentField: Field, nextField: Field, currentValue: any) => any;
}
interface SwitchGroupContext {
    onChange: (conditionValue: string) => void;
    getDisabledState: () => boolean;
    $implicit: RuleSet;
}
interface EmptyWarningContext {
    getDisabledState: () => boolean;
    message: string;
    $implicit: RuleSet;
}
interface ArrowIconContext {
    getDisabledState: () => boolean;
    $implicit: RuleSet;
}
interface EntityContext {
    onChange: (entityValue: string, rule: Rule) => void;
    getDisabledState: () => boolean;
    entities: Entity[];
    $implicit: Rule;
}
interface FieldContext {
    onChange: (fieldValue: string, rule: Rule) => void;
    getFields: (entityName: string) => void;
    getDisabledState: () => boolean;
    fields: Field[];
    $implicit: Rule;
}
interface OperatorContext {
    onChange: () => void;
    getDisabledState: () => boolean;
    operators: string[];
    $implicit: Rule;
}
interface InputContext {
    onChange: () => void;
    getDisabledState: () => boolean;
    options: Option[];
    field: Field;
    $implicit: Rule;
}
interface ButtonGroupContext {
    addRule: () => void;
    addRuleSet: () => void;
    removeRuleSet: () => void;
    getDisabledState: () => boolean;
    $implicit: RuleSet;
}
interface RemoveButtonContext {
    removeRule: (rule: Rule) => void;
    getDisabledState: () => boolean;
    $implicit: Rule;
}

declare class QueryOperatorDirective {
    template: TemplateRef<any>;
    constructor(template: TemplateRef<any>);
    static ɵfac: i0.ɵɵFactoryDeclaration<QueryOperatorDirective, never>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<QueryOperatorDirective, "[queryOperator]", never, {}, {}, never, never, false, never>;
}

declare class QueryFieldDirective {
    template: TemplateRef<any>;
    constructor(template: TemplateRef<any>);
    static ɵfac: i0.ɵɵFactoryDeclaration<QueryFieldDirective, never>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<QueryFieldDirective, "[queryField]", never, {}, {}, never, never, false, never>;
}

declare class QueryEntityDirective {
    template: TemplateRef<any>;
    constructor(template: TemplateRef<any>);
    static ɵfac: i0.ɵɵFactoryDeclaration<QueryEntityDirective, never>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<QueryEntityDirective, "[queryEntity]", never, {}, {}, never, never, false, never>;
}

declare class QuerySwitchGroupDirective {
    template: TemplateRef<any>;
    constructor(template: TemplateRef<any>);
    static ɵfac: i0.ɵɵFactoryDeclaration<QuerySwitchGroupDirective, never>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<QuerySwitchGroupDirective, "[querySwitchGroup]", never, {}, {}, never, never, false, never>;
}

declare class QueryButtonGroupDirective {
    template: TemplateRef<any>;
    constructor(template: TemplateRef<any>);
    static ɵfac: i0.ɵɵFactoryDeclaration<QueryButtonGroupDirective, never>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<QueryButtonGroupDirective, "[queryButtonGroup]", never, {}, {}, never, never, false, never>;
}

declare class QueryInputDirective {
    template: TemplateRef<any>;
    /** Unique name for query input type. */
    get queryInputType(): string;
    set queryInputType(value: string);
    private _type;
    constructor(template: TemplateRef<any>);
    static ɵfac: i0.ɵɵFactoryDeclaration<QueryInputDirective, never>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<QueryInputDirective, "[queryInput]", never, { "queryInputType": { "alias": "queryInputType"; "required": false; }; }, {}, never, never, false, never>;
}

declare class QueryRemoveButtonDirective {
    template: TemplateRef<any>;
    constructor(template: TemplateRef<any>);
    static ɵfac: i0.ɵɵFactoryDeclaration<QueryRemoveButtonDirective, never>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<QueryRemoveButtonDirective, "[queryRemoveButton]", never, {}, {}, never, never, false, never>;
}

declare class QueryEmptyWarningDirective {
    template: TemplateRef<any>;
    constructor(template: TemplateRef<any>);
    static ɵfac: i0.ɵɵFactoryDeclaration<QueryEmptyWarningDirective, never>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<QueryEmptyWarningDirective, "[queryEmptyWarning]", never, {}, {}, never, never, false, never>;
}

declare class QueryArrowIconDirective {
    template: TemplateRef<any>;
    constructor(template: TemplateRef<any>);
    static ɵfac: i0.ɵɵFactoryDeclaration<QueryArrowIconDirective, never>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<QueryArrowIconDirective, "[queryArrowIcon]", never, {}, {}, never, never, false, never>;
}

declare const CONTROL_VALUE_ACCESSOR: any;
declare const VALIDATOR: any;
declare class QueryBuilderComponent implements OnChanges, ControlValueAccessor, Validator {
    private changeDetectorRef;
    fields: Field[];
    filterFields: Field[];
    entities: Entity[];
    defaultClassNames: QueryBuilderClassNames;
    defaultOperatorMap: {
        [key: string]: string[];
    };
    disabled: boolean;
    data: RuleSet;
    get condition(): string;
    onChangeCallback: () => void;
    onTouchedCallback: () => any;
    allowRuleset: boolean;
    allowCollapse: boolean;
    emptyMessage: string;
    classNames: QueryBuilderClassNames;
    operatorMap: {
        [key: string]: string[];
    };
    parentValue?: RuleSet;
    config: QueryBuilderConfig;
    parentArrowIconTemplate: QueryArrowIconDirective;
    parentInputTemplates: QueryList<QueryInputDirective>;
    parentOperatorTemplate: QueryOperatorDirective;
    parentFieldTemplate: QueryFieldDirective;
    parentEntityTemplate: QueryEntityDirective;
    parentSwitchGroupTemplate: QuerySwitchGroupDirective;
    parentButtonGroupTemplate: QueryButtonGroupDirective;
    parentRemoveButtonTemplate: QueryRemoveButtonDirective;
    parentEmptyWarningTemplate: QueryEmptyWarningDirective;
    parentChangeCallback: () => void;
    parentTouchedCallback: () => void;
    persistValueOnFieldChange: boolean;
    treeContainer: ElementRef;
    buttonGroupTemplate: QueryButtonGroupDirective;
    switchGroupTemplate: QuerySwitchGroupDirective;
    fieldTemplate: QueryFieldDirective;
    entityTemplate: QueryEntityDirective;
    operatorTemplate: QueryOperatorDirective;
    removeButtonTemplate: QueryRemoveButtonDirective;
    emptyWarningTemplate: QueryEmptyWarningDirective;
    inputTemplates: QueryList<QueryInputDirective>;
    arrowIconTemplate: QueryArrowIconDirective;
    private defaultTemplateTypes;
    private defaultPersistValueTypes;
    private defaultEmptyList;
    private operatorsCache;
    private inputContextCache;
    private operatorContextCache;
    private fieldContextCache;
    private entityContextCache;
    private removeButtonContextCache;
    private buttonGroupContext;
    constructor(changeDetectorRef: ChangeDetectorRef);
    ngOnChanges(changes: SimpleChanges): void;
    validate(control: AbstractControl): ValidationErrors | null;
    get value(): RuleSet;
    set value(value: RuleSet);
    writeValue(obj: any): void;
    registerOnChange(fn: any): void;
    registerOnTouched(fn: any): void;
    setDisabledState(isDisabled: boolean): void;
    getDisabledState: () => boolean;
    findTemplateForRule(rule: Rule): TemplateRef<any> | any;
    findQueryInput(type: string): QueryInputDirective;
    getOperators(field: string): string[];
    getFields(entity: string): Field[];
    getInputType(field: string, operator: string): string | null;
    getOptions(field: string): Option[];
    getClassNames(...args: string[]): any | string[];
    getDefaultField(entity: Entity): Field | null;
    getDefaultOperator(field: Field): string | null;
    addRule(parent?: RuleSet): void;
    removeRule(rule: Rule, parent?: RuleSet): void;
    addRuleSet(parent?: RuleSet): void;
    removeRuleSet(ruleset?: RuleSet, parent?: RuleSet): void;
    transitionEnd(e: Event): void;
    toggleCollapse(): void;
    computedTreeContainerHeight(): void;
    changeCondition(value: string): void;
    changeOperator(rule: Rule): void;
    coerceValueForOperator(operator: string, value: any, rule: Rule): any;
    changeInput(): void;
    changeField(fieldValue: string, rule: Rule): void;
    changeEntity(entityValue: string, rule: Rule, index: number, data: RuleSet): void;
    getDefaultValue(defaultValue: any): any;
    getOperatorTemplate(): TemplateRef<any> | null;
    getFieldTemplate(): TemplateRef<any> | null;
    getEntityTemplate(): TemplateRef<any> | null;
    getArrowIconTemplate(): TemplateRef<any> | null;
    getButtonGroupTemplate(): TemplateRef<any> | null;
    getSwitchGroupTemplate(): TemplateRef<any> | null;
    getRemoveButtonTemplate(): TemplateRef<any> | null;
    getEmptyWarningTemplate(): TemplateRef<any> | null;
    getQueryItemClassName(local: LocalRuleMeta): string;
    getButtonGroupContext(): ButtonGroupContext;
    getRemoveButtonContext(rule: Rule): RemoveButtonContext;
    getFieldContext(rule: Rule): FieldContext;
    getEntityContext(rule: Rule): EntityContext;
    getSwitchGroupContext(): SwitchGroupContext;
    getArrowIconContext(): ArrowIconContext;
    getEmptyWarningContext(): EmptyWarningContext;
    getOperatorContext(rule: Rule): OperatorContext;
    getInputContext(rule: Rule): InputContext;
    private calculateFieldChangeValue;
    private checkEmptyRuleInRuleset;
    private validateRulesInRuleset;
    private handleDataChange;
    private handleTouched;
    static ɵfac: i0.ɵɵFactoryDeclaration<QueryBuilderComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<QueryBuilderComponent, "query-builder", never, { "disabled": { "alias": "disabled"; "required": false; }; "data": { "alias": "data"; "required": false; }; "allowRuleset": { "alias": "allowRuleset"; "required": false; }; "allowCollapse": { "alias": "allowCollapse"; "required": false; }; "emptyMessage": { "alias": "emptyMessage"; "required": false; }; "classNames": { "alias": "classNames"; "required": false; }; "operatorMap": { "alias": "operatorMap"; "required": false; }; "parentValue": { "alias": "parentValue"; "required": false; }; "config": { "alias": "config"; "required": false; }; "parentArrowIconTemplate": { "alias": "parentArrowIconTemplate"; "required": false; }; "parentInputTemplates": { "alias": "parentInputTemplates"; "required": false; }; "parentOperatorTemplate": { "alias": "parentOperatorTemplate"; "required": false; }; "parentFieldTemplate": { "alias": "parentFieldTemplate"; "required": false; }; "parentEntityTemplate": { "alias": "parentEntityTemplate"; "required": false; }; "parentSwitchGroupTemplate": { "alias": "parentSwitchGroupTemplate"; "required": false; }; "parentButtonGroupTemplate": { "alias": "parentButtonGroupTemplate"; "required": false; }; "parentRemoveButtonTemplate": { "alias": "parentRemoveButtonTemplate"; "required": false; }; "parentEmptyWarningTemplate": { "alias": "parentEmptyWarningTemplate"; "required": false; }; "parentChangeCallback": { "alias": "parentChangeCallback"; "required": false; }; "parentTouchedCallback": { "alias": "parentTouchedCallback"; "required": false; }; "persistValueOnFieldChange": { "alias": "persistValueOnFieldChange"; "required": false; }; "value": { "alias": "value"; "required": false; }; }, {}, ["buttonGroupTemplate", "switchGroupTemplate", "fieldTemplate", "entityTemplate", "operatorTemplate", "removeButtonTemplate", "emptyWarningTemplate", "arrowIconTemplate", "inputTemplates"], never, false, never>;
}

declare class NgxAngularQueryBuilderModule {
    static ɵfac: i0.ɵɵFactoryDeclaration<NgxAngularQueryBuilderModule, never>;
    static ɵmod: i0.ɵɵNgModuleDeclaration<NgxAngularQueryBuilderModule, [typeof QueryBuilderComponent, typeof QueryInputDirective, typeof QueryOperatorDirective, typeof QueryFieldDirective, typeof QueryEntityDirective, typeof QueryButtonGroupDirective, typeof QuerySwitchGroupDirective, typeof QueryRemoveButtonDirective, typeof QueryEmptyWarningDirective, typeof QueryArrowIconDirective], [typeof i11.CommonModule, typeof i12.FormsModule], [typeof QueryBuilderComponent, typeof QueryInputDirective, typeof QueryOperatorDirective, typeof QueryFieldDirective, typeof QueryEntityDirective, typeof QueryButtonGroupDirective, typeof QuerySwitchGroupDirective, typeof QueryRemoveButtonDirective, typeof QueryEmptyWarningDirective, typeof QueryArrowIconDirective]>;
    static ɵinj: i0.ɵɵInjectorDeclaration<NgxAngularQueryBuilderModule>;
}

export { CONTROL_VALUE_ACCESSOR, NgxAngularQueryBuilderModule, QueryArrowIconDirective, QueryBuilderComponent, QueryButtonGroupDirective, QueryEmptyWarningDirective, QueryEntityDirective, QueryFieldDirective, QueryInputDirective, QueryOperatorDirective, QueryRemoveButtonDirective, QuerySwitchGroupDirective, VALIDATOR };
export type { ArrowIconContext, ButtonGroupContext, EmptyWarningContext, Entity, EntityContext, EntityMap, Field, FieldContext, FieldMap, InputContext, LocalRuleMeta, OperatorContext, Option, QueryBuilderClassNames, QueryBuilderConfig, RemoveButtonContext, Rule, RuleSet, SwitchGroupContext };
