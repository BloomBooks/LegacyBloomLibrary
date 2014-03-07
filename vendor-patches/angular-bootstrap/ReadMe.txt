This file describes the patches we've had to make to the vendor-supplied files.

The intent is that each file in this folder is a patch of a corresponding file in the main vendor directory.

However, it may not be easy to determine the exact revision of that file which we patched, which may make it difficult to determine whether the patch is still needed later. So I plan to document them here.

ui-bootstrap-min.js:

One patch, to the code which in the unminified version is Dialog.prototype._removeElementsFromDom = function()...
This function needs to be patched so that it will only decrement activeBackdrops if it is positive.
The change needs to be written in an odd way to achieve this in the minified code.

Look for code like this (the second occurrence of _removeElementsFromDom):
m.prototype._removeElementsFromDom=function(){this.modalEl.remove(),this.options.backdrop&&(n.value--

The patch is to replace "n.value--" with "(n.value>0?n.value--:0)"

Note that the relevant variables might no longer be m and n if minification comes out a bit differently.

This fixes a problem where the detail view (which is implemented as a 'dialog' in ui-bootstrap) was not showing the 'backdrop' that disables the main window while the dialog is displayed. This is a known bug in ui-bootstrap (see https://github.com/angular-ui/bootstrap/pull/381, especially the comment by i8ramin, and related issues) which they don't plan to fix because they are making the whole dialog module obsolete. We can probably get rid of this patch when we enhance our code to work with the new approach to dialogs in a later version of ui-bootstrap.