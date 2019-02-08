# au-selectize
Selectize wrapper for Aurelia written in Typescript

## Install

1. Install the selectize library using NPM:

	```shell
	npm install selectize
	```
  
2. Copy `au-selectize.ts` file into your project.

3. (optional) Add `au-selectize` as a global resource in your `main.ts`. If not, you will need to use `<require>` in your view

	```shell
	aurelia.globalResources(PLATFORM.moduleName("./au-selectize"))
	```
	Note the path in moduleName must reflect where you copied the .ts file into your project
  
4. Somewhere in your solution, such as the `main.ts` file, import one of the provided selectize stylesheets (note they have separate stylesheets for bootstrap 2, 3, etc.):

	```shell
	import 'selectize/dist/css/selectize.css';
	```
  
	If you are using LESS, consider importing the LESS files into your own.
