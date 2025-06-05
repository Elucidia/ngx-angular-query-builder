import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { QueryBuilderComponent } from "./query-builder/query-builder.component";
import { QueryArrowIconDirective } from "./query-builder/query-arrow-icon.directive";
import { QueryFieldDirective } from "./query-builder/query-field.directive";
import { QueryInputDirective } from "./query-builder/query-input.directive";
import { QueryEntityDirective } from "./query-builder/query-entity.directive";
import { QueryOperatorDirective } from "./query-builder/query-operator.directive";
import { QueryButtonGroupDirective } from "./query-builder/query-button-group.directive";
import { QuerySwitchGroupDirective } from "./query-builder/query-switch-group.directive";
import { QueryRemoveButtonDirective } from "./query-builder/query-remove-button.directive";
import { QueryEmptyWarningDirective } from "./query-builder/query-empty-warning.directive";
import * as i0 from "@angular/core";
export class NgxAngularQueryBuilderModule {
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.0.3", ngImport: i0, type: NgxAngularQueryBuilderModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule }); }
    static { this.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "18.0.3", ngImport: i0, type: NgxAngularQueryBuilderModule, declarations: [QueryBuilderComponent,
            QueryInputDirective,
            QueryOperatorDirective,
            QueryFieldDirective,
            QueryEntityDirective,
            QueryButtonGroupDirective,
            QuerySwitchGroupDirective,
            QueryRemoveButtonDirective,
            QueryEmptyWarningDirective,
            QueryArrowIconDirective], imports: [CommonModule, FormsModule], exports: [QueryBuilderComponent,
            QueryInputDirective,
            QueryOperatorDirective,
            QueryFieldDirective,
            QueryEntityDirective,
            QueryButtonGroupDirective,
            QuerySwitchGroupDirective,
            QueryRemoveButtonDirective,
            QueryEmptyWarningDirective,
            QueryArrowIconDirective] }); }
    static { this.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "18.0.3", ngImport: i0, type: NgxAngularQueryBuilderModule, imports: [CommonModule, FormsModule] }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.0.3", ngImport: i0, type: NgxAngularQueryBuilderModule, decorators: [{
            type: NgModule,
            args: [{
                    imports: [CommonModule, FormsModule],
                    declarations: [
                        QueryBuilderComponent,
                        QueryInputDirective,
                        QueryOperatorDirective,
                        QueryFieldDirective,
                        QueryEntityDirective,
                        QueryButtonGroupDirective,
                        QuerySwitchGroupDirective,
                        QueryRemoveButtonDirective,
                        QueryEmptyWarningDirective,
                        QueryArrowIconDirective
                    ],
                    exports: [
                        QueryBuilderComponent,
                        QueryInputDirective,
                        QueryOperatorDirective,
                        QueryFieldDirective,
                        QueryEntityDirective,
                        QueryButtonGroupDirective,
                        QuerySwitchGroupDirective,
                        QueryRemoveButtonDirective,
                        QueryEmptyWarningDirective,
                        QueryArrowIconDirective
                    ]
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmd4LWFuZ3VsYXItcXVlcnktYnVpbGRlci5tb2R1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wcm9qZWN0cy9uZ3gtYW5ndWxhci1xdWVyeS1idWlsZGVyL3NyYy9saWIvbmd4LWFuZ3VsYXItcXVlcnktYnVpbGRlci5tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUN6QyxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFDL0MsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBRTdDLE9BQU8sRUFBRSxxQkFBcUIsRUFBRSxNQUFNLHlDQUF5QyxDQUFDO0FBRWhGLE9BQU8sRUFBRSx1QkFBdUIsRUFBRSxNQUFNLDRDQUE0QyxDQUFDO0FBQ3JGLE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxNQUFNLHVDQUF1QyxDQUFDO0FBQzVFLE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxNQUFNLHVDQUF1QyxDQUFDO0FBQzVFLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxNQUFNLHdDQUF3QyxDQUFDO0FBQzlFLE9BQU8sRUFBRSxzQkFBc0IsRUFBRSxNQUFNLDBDQUEwQyxDQUFDO0FBQ2xGLE9BQU8sRUFBRSx5QkFBeUIsRUFBRSxNQUFNLDhDQUE4QyxDQUFDO0FBQ3pGLE9BQU8sRUFBRSx5QkFBeUIsRUFBRSxNQUFNLDhDQUE4QyxDQUFDO0FBQ3pGLE9BQU8sRUFBRSwwQkFBMEIsRUFBRSxNQUFNLCtDQUErQyxDQUFDO0FBQzNGLE9BQU8sRUFBRSwwQkFBMEIsRUFBRSxNQUFNLCtDQUErQyxDQUFDOztBQTZCM0YsTUFBTSxPQUFPLDRCQUE0Qjs4R0FBNUIsNEJBQTRCOytHQUE1Qiw0QkFBNEIsaUJBeEJyQyxxQkFBcUI7WUFDckIsbUJBQW1CO1lBQ25CLHNCQUFzQjtZQUN0QixtQkFBbUI7WUFDbkIsb0JBQW9CO1lBQ3BCLHlCQUF5QjtZQUN6Qix5QkFBeUI7WUFDekIsMEJBQTBCO1lBQzFCLDBCQUEwQjtZQUMxQix1QkFBdUIsYUFYZixZQUFZLEVBQUUsV0FBVyxhQWNqQyxxQkFBcUI7WUFDckIsbUJBQW1CO1lBQ25CLHNCQUFzQjtZQUN0QixtQkFBbUI7WUFDbkIsb0JBQW9CO1lBQ3BCLHlCQUF5QjtZQUN6Qix5QkFBeUI7WUFDekIsMEJBQTBCO1lBQzFCLDBCQUEwQjtZQUMxQix1QkFBdUI7K0dBR2QsNEJBQTRCLFlBMUI3QixZQUFZLEVBQUUsV0FBVzs7MkZBMEJ4Qiw0QkFBNEI7a0JBM0J4QyxRQUFRO21CQUFDO29CQUNSLE9BQU8sRUFBRSxDQUFDLFlBQVksRUFBRSxXQUFXLENBQUM7b0JBQ3BDLFlBQVksRUFBRTt3QkFDWixxQkFBcUI7d0JBQ3JCLG1CQUFtQjt3QkFDbkIsc0JBQXNCO3dCQUN0QixtQkFBbUI7d0JBQ25CLG9CQUFvQjt3QkFDcEIseUJBQXlCO3dCQUN6Qix5QkFBeUI7d0JBQ3pCLDBCQUEwQjt3QkFDMUIsMEJBQTBCO3dCQUMxQix1QkFBdUI7cUJBQ3hCO29CQUNELE9BQU8sRUFBRTt3QkFDUCxxQkFBcUI7d0JBQ3JCLG1CQUFtQjt3QkFDbkIsc0JBQXNCO3dCQUN0QixtQkFBbUI7d0JBQ25CLG9CQUFvQjt3QkFDcEIseUJBQXlCO3dCQUN6Qix5QkFBeUI7d0JBQ3pCLDBCQUEwQjt3QkFDMUIsMEJBQTBCO3dCQUMxQix1QkFBdUI7cUJBQ3hCO2lCQUNGIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTmdNb2R1bGUgfSBmcm9tIFwiQGFuZ3VsYXIvY29yZVwiO1xuaW1wb3J0IHsgQ29tbW9uTW9kdWxlIH0gZnJvbSBcIkBhbmd1bGFyL2NvbW1vblwiO1xuaW1wb3J0IHsgRm9ybXNNb2R1bGUgfSBmcm9tIFwiQGFuZ3VsYXIvZm9ybXNcIjtcblxuaW1wb3J0IHsgUXVlcnlCdWlsZGVyQ29tcG9uZW50IH0gZnJvbSBcIi4vcXVlcnktYnVpbGRlci9xdWVyeS1idWlsZGVyLmNvbXBvbmVudFwiO1xuXG5pbXBvcnQgeyBRdWVyeUFycm93SWNvbkRpcmVjdGl2ZSB9IGZyb20gXCIuL3F1ZXJ5LWJ1aWxkZXIvcXVlcnktYXJyb3ctaWNvbi5kaXJlY3RpdmVcIjtcbmltcG9ydCB7IFF1ZXJ5RmllbGREaXJlY3RpdmUgfSBmcm9tIFwiLi9xdWVyeS1idWlsZGVyL3F1ZXJ5LWZpZWxkLmRpcmVjdGl2ZVwiO1xuaW1wb3J0IHsgUXVlcnlJbnB1dERpcmVjdGl2ZSB9IGZyb20gXCIuL3F1ZXJ5LWJ1aWxkZXIvcXVlcnktaW5wdXQuZGlyZWN0aXZlXCI7XG5pbXBvcnQgeyBRdWVyeUVudGl0eURpcmVjdGl2ZSB9IGZyb20gXCIuL3F1ZXJ5LWJ1aWxkZXIvcXVlcnktZW50aXR5LmRpcmVjdGl2ZVwiO1xuaW1wb3J0IHsgUXVlcnlPcGVyYXRvckRpcmVjdGl2ZSB9IGZyb20gXCIuL3F1ZXJ5LWJ1aWxkZXIvcXVlcnktb3BlcmF0b3IuZGlyZWN0aXZlXCI7XG5pbXBvcnQgeyBRdWVyeUJ1dHRvbkdyb3VwRGlyZWN0aXZlIH0gZnJvbSBcIi4vcXVlcnktYnVpbGRlci9xdWVyeS1idXR0b24tZ3JvdXAuZGlyZWN0aXZlXCI7XG5pbXBvcnQgeyBRdWVyeVN3aXRjaEdyb3VwRGlyZWN0aXZlIH0gZnJvbSBcIi4vcXVlcnktYnVpbGRlci9xdWVyeS1zd2l0Y2gtZ3JvdXAuZGlyZWN0aXZlXCI7XG5pbXBvcnQgeyBRdWVyeVJlbW92ZUJ1dHRvbkRpcmVjdGl2ZSB9IGZyb20gXCIuL3F1ZXJ5LWJ1aWxkZXIvcXVlcnktcmVtb3ZlLWJ1dHRvbi5kaXJlY3RpdmVcIjtcbmltcG9ydCB7IFF1ZXJ5RW1wdHlXYXJuaW5nRGlyZWN0aXZlIH0gZnJvbSBcIi4vcXVlcnktYnVpbGRlci9xdWVyeS1lbXB0eS13YXJuaW5nLmRpcmVjdGl2ZVwiO1xuXG5ATmdNb2R1bGUoe1xuICBpbXBvcnRzOiBbQ29tbW9uTW9kdWxlLCBGb3Jtc01vZHVsZV0sXG4gIGRlY2xhcmF0aW9uczogW1xuICAgIFF1ZXJ5QnVpbGRlckNvbXBvbmVudCxcbiAgICBRdWVyeUlucHV0RGlyZWN0aXZlLFxuICAgIFF1ZXJ5T3BlcmF0b3JEaXJlY3RpdmUsXG4gICAgUXVlcnlGaWVsZERpcmVjdGl2ZSxcbiAgICBRdWVyeUVudGl0eURpcmVjdGl2ZSxcbiAgICBRdWVyeUJ1dHRvbkdyb3VwRGlyZWN0aXZlLFxuICAgIFF1ZXJ5U3dpdGNoR3JvdXBEaXJlY3RpdmUsXG4gICAgUXVlcnlSZW1vdmVCdXR0b25EaXJlY3RpdmUsXG4gICAgUXVlcnlFbXB0eVdhcm5pbmdEaXJlY3RpdmUsXG4gICAgUXVlcnlBcnJvd0ljb25EaXJlY3RpdmVcbiAgXSxcbiAgZXhwb3J0czogW1xuICAgIFF1ZXJ5QnVpbGRlckNvbXBvbmVudCxcbiAgICBRdWVyeUlucHV0RGlyZWN0aXZlLFxuICAgIFF1ZXJ5T3BlcmF0b3JEaXJlY3RpdmUsXG4gICAgUXVlcnlGaWVsZERpcmVjdGl2ZSxcbiAgICBRdWVyeUVudGl0eURpcmVjdGl2ZSxcbiAgICBRdWVyeUJ1dHRvbkdyb3VwRGlyZWN0aXZlLFxuICAgIFF1ZXJ5U3dpdGNoR3JvdXBEaXJlY3RpdmUsXG4gICAgUXVlcnlSZW1vdmVCdXR0b25EaXJlY3RpdmUsXG4gICAgUXVlcnlFbXB0eVdhcm5pbmdEaXJlY3RpdmUsXG4gICAgUXVlcnlBcnJvd0ljb25EaXJlY3RpdmVcbiAgXVxufSlcbmV4cG9ydCBjbGFzcyBOZ3hBbmd1bGFyUXVlcnlCdWlsZGVyTW9kdWxlIHt9XG4iXX0=