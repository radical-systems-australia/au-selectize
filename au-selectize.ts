import { BindingEngine, bindingMode, Disposable } from "aurelia-binding";
import { autoinject } from "aurelia-dependency-injection";
import { bindable, customElement } from "aurelia-templating";
import * as $ from 'jquery';
import 'selectize';

@customElement("au-selectize")
@autoinject()
export class AuSelectize {

    static $view = '<template><select ref="selectElement"></select></template>'

    @bindable({ defaultBindingMode: bindingMode.oneWay }) options: any[] = [];
    @bindable({ defaultBindingMode: bindingMode.oneTime }) multiselect: boolean = false;

    @bindable({ defaultBindingMode: bindingMode.twoWay }) selectedValue: any;
    @bindable({ defaultBindingMode: bindingMode.twoWay }) selectedObject: any;

    @bindable({ defaultBindingMode: bindingMode.twoWay }) selectedValues: any[];
    @bindable({ defaultBindingMode: bindingMode.twoWay }) selectedObjects: any[];

    @bindable({ defaultBindingMode: bindingMode.oneTime }) displayProperty: string = "description";
    @bindable({ defaultBindingMode: bindingMode.oneTime }) valueProperty: string = "id";
    @bindable({ defaultBindingMode: bindingMode.oneTime }) searchProperty: string; //default on bind to displayProperty if not set
    @bindable({ defaultBindingMode: bindingMode.oneTime }) sortProperty: string; //default on bind to displayProperty if not set

    selectElement: Element;
    selectizeApi: any;
    optionsObserver: Disposable;

    constructor(private readonly bindingEngine: BindingEngine) {

    }

    attached() {
        let plugins = [];

        if (this.multiselect) {
            plugins.push('remove_button');
        }

        $(this.selectElement).selectize({
            plugins: plugins,
            sortField: this.sortProperty,
            searchProperty: this.searchProperty,
            maxItems: this.multiselect ? null : 1
        });

        this.selectizeApi = (<any>this.selectElement).selectize;
        this.selectizeApi.on('change', (value) => { this.itemSelected(value); });
        this.selectizeApi.on("item_remove", (value) => { this.itemRemoved(value); });

        this.optionsChanged();
    }

    private itemSelected(value) {
        if (value instanceof Array) {
            //multi select - update based on selection mutations (do not reassign array, as this could break observers)
            if (!this.selectedValues) {
                this.selectedValues = [];
            }
            if (!this.selectedObjects) {
                this.selectedObjects = [];
            }
            //only add values that aren't already added:
            for (let newValue of value) {
                //if the value property is numeric, cast string back to number
                if (this.valueIsNumeric) {
                    newValue = +newValue;
                }
                if (this.selectedValues.indexOf(newValue) < 0) {
                    this.selectedValues.push(newValue);
                    this.selectedObjects.push(this.options.find(x => x[this.valueProperty] == newValue));
                }
            }
        } else {
            //if the value property is numeric, cast string back to number
            if (this.valueIsNumeric && value !== "") {
                value = +value;
            }
            this.selectedValue = value;
            this.selectedObject = this.options.find(x => x[this.valueProperty] == value);
        }
    }

    private itemRemoved(value) {
        if (this.valueIsNumeric) {
            value = +value;
        }
        if (this.multiselect) {
            this.selectedValues.splice(this.selectedValues.indexOf(value), 1);
            this.selectedObjects.splice(this.selectedObjects.findIndex(x => {
                return x[this.valueProperty] == value;
            }), 1);
        } else {
            this.selectedValue = null;
            this.selectedObject = null;
        }
    }

    bind() {
        //note: removing bind() will cause Changed events to trigger on init, which will break optionsChanged()
        if (!this.searchProperty) {
            this.searchProperty = this.displayProperty;
        }
        if (!this.sortProperty) {
            this.sortProperty = this.displayProperty;
        }
    }

    optionsChanged() {
        this.syncOptions();
        //manage colelction observer below to listen  for mutations against newly assigned options collection
        if (this.optionsObserver) {
            this.optionsObserver.dispose();
        }
        this.optionsObserver = this.bindingEngine.collectionObserver(this.options).subscribe((changes) => {
            for (let change of changes) {
                if (change.addedCount > 0) {
                    //from the index they were added, cycle through and add the objects to selectize based on addedCount
                    for (let i = 0; i < change.addedCount; i++) {
                        this.selectizeApi.addOption({
                            value: this.options[change.index + i][this.valueProperty],
                            text: this.options[change.index + i][this.displayProperty]
                        });
                    }
                }
                for (let removedObject of change.removed) {
                    //remove them by object.value property
                    this.selectizeApi.removeOption(removedObject[this.valueProperty]);
                }
            }
            this.selectizeApi.refreshItems();
        });
    }

    private syncOptions() {
        //add options manually via API since aurelia's repeater on option gets messed up by selectize
        this.selectizeApi.clearOptions();
        for (let option of this.options) {
            this.selectizeApi.addOption({
                value: option[this.valueProperty],
                text: option[this.displayProperty]
            });
        }
        this.selectizeApi.refreshItems();
    }

    get valueIsNumeric(): boolean {
        if (this.options && this.options.length > 0) {
            return typeof this.options[0][this.valueProperty] == 'number';
        }
    }

    detached() {
        if (this.selectizeApi) {
            this.selectizeApi.destroy();
        }
    }
}