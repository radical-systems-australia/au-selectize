
# au-selectize
Selectize wrapper for Aurelia written in Typescript

## Basic Usage
An example with collection of options such as:
```    
options: any[] = [
        { value: 1, text: 'Option 1' },
        { value: 2, text: 'Option 2' },
        { value: 3, text: 'Option 3' },
        { value: 4, text: 'Option 4' }
    ];
```
Single select example:
```
<au-selectize options.bind="options" 
	value-property="value" 
	display-property="text" 
	selected-value.bind="selectedValue">
</au-selectize>
```
Miltiselect select example:
```
<au-selectize options.bind="options" 
	value-property="value" 
	display-property="text" 
	multiselect.one-time="true"
	selected-values.bind="selectedValues">
</au-selectize>
```

## Install

1. Install the selectize library using NPM:

	```shell
	npm install selectize@0.12.6
	```
	
2. Install the selectize types:

	```shell
	npm install @types/selectize@0.12.34
	```
  
3. Copy `au-selectize.ts` file into your project.

4. (optional) Add `au-selectize` as a global resource in your `main.ts`. If not, you will need to use `<require>` in your view

	```shell
	aurelia.globalResources(PLATFORM.moduleName("./au-selectize"))
	```
	Note the path in moduleName must reflect where you copied the .ts file into your project
  
5. Somewhere in your solution, such as the `main.ts` file, import one of the provided selectize stylesheets (note they have separate stylesheets for bootstrap 2, 3, etc.):

	```shell
	import 'selectize/dist/css/selectize.css';
	```
  
	If you are using LESS, consider importing the LESS files into your own.

## Bindings

| Binding| Data Type | Mode | Description |
|--|--|--|--|
|options | Array&lt;any&gt; | oneWay | The options to render in the drop down.  |
| multiselect | boolean | oneTime | Used to determine whether to render a multi select or single select drop down|
| selected-value | any | twoWay | The value field of the object selected in the drop down. Only affected when `multiselect` is false. |
| selected-object | any | twoWay | The object selected in the drop down. Only affected when `multiselect` is false. |
| selected-values | Array&lt;any&gt; | twoWay | The values field of the object selected in the drop down. Only affected when `multiselect` is true. |
| selected-objects | Array&lt;any&gt; | twoWay |  The objects selected in the drop down. Only affected when `multiselect` is true. |
| displayProperty | string | oneTime | The name of the property on the options objects to render in the drop down. |
| valueProperty | string | oneTime |  The name of the property to use as the value for the selected item in the drop down. |
| searchProperty | string | oneTime | The name of the property from the option object that selectize will filter against. |
| sortProperty | string | oneTime | The name of the property from the option object that selectize will sort against. |
