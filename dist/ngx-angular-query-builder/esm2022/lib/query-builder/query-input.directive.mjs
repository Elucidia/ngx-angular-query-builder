import { Directive, Input } from "@angular/core";
import * as i0 from "@angular/core";
export class QueryInputDirective {
    /** Unique name for query input type. */
    get queryInputType() {
        return this._type;
    }
    set queryInputType(value) {
        // If the directive is set without a type (updated programatically), then this setter will
        // trigger with an empty string and should not overwrite the programatically set value.
        if (!value) {
            return;
        }
        this._type = value;
    }
    constructor(template) {
        this.template = template;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.0.3", ngImport: i0, type: QueryInputDirective, deps: [{ token: i0.TemplateRef }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "18.0.3", type: QueryInputDirective, selector: "[queryInput]", inputs: { queryInputType: "queryInputType" }, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.0.3", ngImport: i0, type: QueryInputDirective, decorators: [{
            type: Directive,
            args: [{ selector: "[queryInput]" }]
        }], ctorParameters: () => [{ type: i0.TemplateRef }], propDecorators: { queryInputType: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnktaW5wdXQuZGlyZWN0aXZlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvbmd4LWFuZ3VsYXItcXVlcnktYnVpbGRlci9zcmMvbGliL3F1ZXJ5LWJ1aWxkZXIvcXVlcnktaW5wdXQuZGlyZWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFlLE1BQU0sZUFBZSxDQUFDOztBQUc5RCxNQUFNLE9BQU8sbUJBQW1CO0lBQzlCLHdDQUF3QztJQUN4QyxJQUNJLGNBQWM7UUFDaEIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDO0lBQ3BCLENBQUM7SUFDRCxJQUFJLGNBQWMsQ0FBQyxLQUFhO1FBQzlCLDBGQUEwRjtRQUMxRix1RkFBdUY7UUFDdkYsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ1gsT0FBTztRQUNULENBQUM7UUFDRCxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztJQUNyQixDQUFDO0lBR0QsWUFBbUIsUUFBMEI7UUFBMUIsYUFBUSxHQUFSLFFBQVEsQ0FBa0I7SUFBRyxDQUFDOzhHQWhCdEMsbUJBQW1CO2tHQUFuQixtQkFBbUI7OzJGQUFuQixtQkFBbUI7a0JBRC9CLFNBQVM7bUJBQUMsRUFBRSxRQUFRLEVBQUUsY0FBYyxFQUFFO2dGQUlqQyxjQUFjO3NCQURqQixLQUFLIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRGlyZWN0aXZlLCBJbnB1dCwgVGVtcGxhdGVSZWYgfSBmcm9tIFwiQGFuZ3VsYXIvY29yZVwiO1xuXG5ARGlyZWN0aXZlKHsgc2VsZWN0b3I6IFwiW3F1ZXJ5SW5wdXRdXCIgfSlcbmV4cG9ydCBjbGFzcyBRdWVyeUlucHV0RGlyZWN0aXZlIHtcbiAgLyoqIFVuaXF1ZSBuYW1lIGZvciBxdWVyeSBpbnB1dCB0eXBlLiAqL1xuICBASW5wdXQoKVxuICBnZXQgcXVlcnlJbnB1dFR5cGUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5fdHlwZTtcbiAgfVxuICBzZXQgcXVlcnlJbnB1dFR5cGUodmFsdWU6IHN0cmluZykge1xuICAgIC8vIElmIHRoZSBkaXJlY3RpdmUgaXMgc2V0IHdpdGhvdXQgYSB0eXBlICh1cGRhdGVkIHByb2dyYW1hdGljYWxseSksIHRoZW4gdGhpcyBzZXR0ZXIgd2lsbFxuICAgIC8vIHRyaWdnZXIgd2l0aCBhbiBlbXB0eSBzdHJpbmcgYW5kIHNob3VsZCBub3Qgb3ZlcndyaXRlIHRoZSBwcm9ncmFtYXRpY2FsbHkgc2V0IHZhbHVlLlxuICAgIGlmICghdmFsdWUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5fdHlwZSA9IHZhbHVlO1xuICB9XG4gIHByaXZhdGUgX3R5cGUhOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IocHVibGljIHRlbXBsYXRlOiBUZW1wbGF0ZVJlZjxhbnk+KSB7fVxufVxuIl19