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
    selectizeApi: Selectize.IApi<any, any>;
    optionsObserver: Disposable;
    selectedValuesObserver: Disposable;
    selectedObjectsObserver: Disposable;

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
            //only add values that aren't already added:
            for (let newValue of value) {
                //if the value property is numeric, cast string back to number
                if (this.valueIsNumeric) {
                    newValue = +newValue;
                }
                if (this.selectedValues.indexOf(newValue) < 0) {
                    this.selectedValues.push(newValue);
                }
            }
        } else {
            //if the value property is numeric, cast string back to number
            if (this.valueIsNumeric && value !== "") {
                value = +value;
            }
            this.selectedValue = value;
        }
    }

    private itemRemoved(value) {
        if (this.valueIsNumeric) {
            value = +value;
        }
        if (this.multiselect) {
            if (this.selectedValues.indexOf(value) > -1) {
                this.selectedValues.splice(this.selectedValues.indexOf(value), 1);
            }
        } else {
            if (this.selectedValue !== null) {
                this.selectedValue = null;
            }
        }
    }

    selectedValueChanged() {
        //sync object and value
        if (this.selectedValue && (!this.selectedObject || this.selectedValue !== this.selectedObject[this.valueProperty])) {
            let option = this.options.find(x => x[this.valueProperty] === this.selectedValue);
            if (!option) {
                throw new Error(`The selected value '${this.selectedValue}' does not exist in the provided options.`);
            }
            this.selectedObject = option;
        }
        if (!this.selectedValue) {
            this.selectedObject = null;
        }
        //ensure is selected in the selectize control
        if ((this.selectedValue === null || this.selectedValue === undefined) && this.selectizeApi.items && this.selectizeApi.items.length > 0) {
            //new value is null/undefined and items are selected, so clear
            this.selectizeApi.clear();
        } else if (this.selectedValue !== null && this.selectedValue !== undefined) {
            //new value exists, add it if it isn't already
            if (this.selectizeApi.items.findIndex(x => x[this.valueProperty] === this.selectedValue) === -1) {
                //clear any old selections, then add
                this.selectizeApi.clear();
                this.selectizeApi.addItem(this.selectedValue, true);
            }
        }
    }

    selectedObjectChanged() {
        //sync object and value
        if (this.selectedValue && (!this.selectedObject || this.selectedValue !== this.selectedObject[this.valueProperty])) {
            this.selectedValue = this.selectedObject[this.valueProperty];
        }
        if (!this.selectedValue && this.selectedObject) {
            this.selectedObject = null;
        }
        //control is synced in the selectedValueChanged handler, so no requirement to do that here.
    }

    selectedValuesChanged() {
        this.selectizeApi.clear();
        if (this.selectedValuesObserver) {
            this.selectedValuesObserver.dispose();
        }
        //sync object and value
        if (!this.selectedValues) {
            //only assign null if it isn't already to avoid loops
            if (this.selectedObjects !== null) {
                this.selectedObjects = null;
            }
        } else if (this.selectedValues) {
            //need to check if they contain the same values before we proceed...
            if (!this.selectedObjectsAndValuesAreSame) {
                let newObjects = [];
                if (this.selectedValues.length > 0) {
                    for (let value of this.selectedValues) {
                        //sync selected objects
                        let object = this.options.find(x => x[this.valueProperty] === value);
                        if (!object) {
                            throw new Error(`The selected value '${this.selectedValue}' does not exist in the provided options.`);
                        }
                        newObjects.push(object);
                    }
                }
                this.selectedObjects = newObjects;
            }
        }

        //sync with selectize control
        for (let value of this.selectedValues) {
            //sync selectize control
            let valueString = value;
            if (this.valueIsNumeric) {
                valueString = value.toString();
            }
            if (this.selectizeApi.items.indexOf(valueString) === -1) {
                this.selectizeApi.addItem(value, true);
            }
        }

        //set up observers and handle mutations as well
        this.registerSelectedValuesObserver();
    }

    private registerSelectedValuesObserver() {
        if (this.selectedValues && this.selectedValues instanceof Array) {
            this.selectedValuesObserver = this.bindingEngine.collectionObserver(this.selectedValues).subscribe((changes) => {
                let objectsArray = this.selectedObjects ? this.selectedObjects : [];
                for (let change of changes) {
                    if (change.addedCount > 0) {
                        for (let i = 0; i < change.addedCount; i++) {
                            let addedValue = this.selectedValues[(change.index + i)];
                            //sync selectize control
                            if (this.selectizeApi.items.indexOf(addedValue) === -1) {
                                this.selectizeApi.addItem(addedValue, true);
                            }
                            //sync selected objects
                            let object = this.options.find(x => x[this.valueProperty] === addedValue);
                            if (!object) {
                                throw new Error(`The selected value '${addedValue}' does not exist in the provided options.`);
                            }
                            if (objectsArray.indexOf(object) === -1) {
                                objectsArray.push(object);
                            }
                        }
                    }
                    for (let removedValue of change.removed) {
                        //sync selected objects
                        let index = objectsArray.findIndex(x => x[this.valueProperty] === removedValue);
                        if (index > -1) {
                            objectsArray.splice(index, 1);
                        }
                        //sync selectize control
                        //note selectizeApi.items are strings so if using numeric values, convert to string before comparison.
                        let removedValueString = removedValue;
                        if (this.valueIsNumeric) {
                            removedValueString = removedValue.toString();
                        }
                        if (this.selectizeApi.items.indexOf(removedValueString) > -1) {
                            this.selectizeApi.removeItem(removedValue, true);
                        }
                    }
                }
                //if we created a new array instead of modifying the existing, we neet to assign it
                if (!this.selectedObjects) {
                    this.selectedObjects = objectsArray;
                }
            });
        }
    }

    selectedObjectsChanged() {
        //set up observers and handle mutations as well
        if (this.selectedObjectsObserver) {
            this.selectedObjectsObserver.dispose();
        }
        //sync object and value
        if (!this.selectedObjects) {
            //only assign null if it isn't already to avoid loops
            if (this.selectedValues !== null) {
                this.selectedValues = null;
            }
        } else if (this.selectedObjects) {
            //need to check if they contain the same values before we proceed...
            if (!this.selectedObjectsAndValuesAreSame) {
                let newValues = [];
                if (this.selectedObjects.length > 0) {
                    for (let object of this.selectedObjects) {
                        //sync selected objects
                        newValues.push(object[this.valueProperty]);
                    }
                }
                this.selectedValues = newValues;
            }
        }

        this.registerSelectedObjectsObserver();
    }

    private registerSelectedObjectsObserver() {
        if (this.selectedObjects && this.selectedObjects instanceof Array) {
            this.selectedObjectsObserver = this.bindingEngine.collectionObserver(this.selectedObjects).subscribe((changes) => {
                let valuesArray = this.selectedValues ? this.selectedValues : [];
                for (let change of changes) {
                    if (change.addedCount > 0) {
                        for (let i = 0; i < change.addedCount; i++) {
                            let addedObject = this.selectedObjects[change.index + i];
                            //sync selected values
                            if (this.selectedValues.indexOf(addedObject[this.valueProperty]) === -1) {
                                this.selectedValues.push(addedObject[this.valueProperty]);
                            }
                        }
                    }
                    for (let removedObject of change.removed) {
                        //sync selected objects
                        let index = this.selectedValues.indexOf(removedObject[this.valueProperty]);
                        if (index > -1) {
                            this.selectedValues.splice(index, 1);
                        }
                    }
                }
                //if we created a new array instead of modifying the existing, we neet to assign it
                if (!this.selectedValues) {
                    this.selectedValues = valuesArray;
                }
            });
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
        this.registerSelectedValuesObserver();
        this.registerSelectedObjectsObserver();
    }

    detached() {
        if (this.selectizeApi) {
            this.selectizeApi.destroy();
        }
    }

    optionsChanged() {
        this.syncOptions();
        //manage colelction observer below to listen  for mutations against newly assigned options collection
        if (this.optionsObserver) {
            this.optionsObserver.dispose();
        }
        if (this.options && this.options instanceof Array) {
            //set up a new observer if options are not null
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
    }

    private syncOptions() {
        //add options manually via API since aurelia's repeater on option gets messed up by selectize
        this.selectizeApi.clearOptions();
        if (this.options && this.options.length > 0) {
            for (let option of this.options) {
                this.selectizeApi.addOption({
                    value: option[this.valueProperty],
                    text: option[this.displayProperty]
                });
            }
        }
        this.selectizeApi.refreshItems();
    }

    get valueIsNumeric(): boolean {
        if (this.options && this.options.length > 0) {
            return typeof this.options[0][this.valueProperty] == 'number';
        }
        return false;
    }

    get selectedObjectsAndValuesAreSame(): boolean {
        if (!this.selectedValues && !this.selectedObjects) {
            return true;
        }
        if (this.selectedValues && !this.selectedObjects) {
            return false;
        }
        if (!this.selectedValues && this.selectedObjects) {
            return false;
        }
        //both truthy.. loop through and check the items
        for (let value of this.selectedValues) {
            if (this.selectedObjects.findIndex(x => x[this.valueProperty] === value) === -1) {
                return false;
            }
        }
        for (let object of this.selectedObjects) {
            if (this.selectedValues.findIndex(x => x === object[this.valueProperty]) === -1) {
                return false;
            }
        }
        return true;
    }
}
