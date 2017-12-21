This script provides the integration between the [10k genes submission form](https://biobricks.org/10k-genes-survey/) and the [10 genes instance of the Public Domain Chronicle](https://pdc.biobricks.org/tenkgenes) such that checking the _"Contribute to the PDC"_ checkbox on the 10k genes submission form will submit normally and then take the user to the PDC submission form where the user name and submitted sequences will already have been entered.

For this to work, the `index.js` file from this repo must be available at the URL:

```
/wp-content/10k-genes-pdc-integration/index.js
```

The wordpress page for the 10k genes submission form is called "10K Genes Survey" and can be edited [here](https://biobricks.org/wordpress/wp-admin/post.php?post=2907&action=edit).

***WARNING IF YOU EDIT THE FORM USING GRAVITYFORMS***: If you remove and re-add any form element then its name (in the html) will change and this integration will break until you edit the variables at the top of `index.js` to compensate.

In order to get this integration to work it was necessary to edit the "10K Genes Survey" wordpress page using the Divi Builder to add a `Code` element to the bottom of the page containing the following:

```
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
<script src="/wp-content/10k-genes-pdc-integration/index.js"></script>
```

