import { TemplateRef } from "@angular/core";
import * as i0 from "@angular/core";
export declare class QueryInputDirective {
    template: TemplateRef<any>;
    /** Unique name for query input type. */
    get queryInputType(): string;
    set queryInputType(value: string);
    private _type;
    constructor(template: TemplateRef<any>);
    static ɵfac: i0.ɵɵFactoryDeclaration<QueryInputDirective, never>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<QueryInputDirective, "[queryInput]", never, { "queryInputType": { "alias": "queryInputType"; "required": false; }; }, {}, never, never, false, never>;
}
