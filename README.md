# lore-gadget
---

The Open Annotation lorestore OpenSocial Gadget was developed at the UQ ITEE eResearch Lab: http://itee.uq.edu.au/~eresearch

## About

The LORE OpenSocial Gadget provides services for storing Open Annotation (OA) annotations and ORE Resource Map bodies and targets.

The source code for the lorestore gadget is available from [GitHub](https://github.com/uq-eresearch/lore-gadget/)

## Packaging

Apache Maven is used for dependency management and building the gadget. 

The web app can be configured via the constants.js file in webapp folder.

We use eclipse to import lorestore into the workspace as a Maven project (using eGit and m2eclipse). 
We build the war file via an eclipse Maven run configuration equivalent to the following command:
mvn clean package

To configure the eclipse run configuration, set basedir to `${workspace_loc:/lore-gadget}` and goals to `clean package`.

The resulting war file will be `lore-gadget/target/lore-gadget.war`


## History

This web app is derivative of the [lorestore webapp](https://github.com/uq-eresearch/lorestore), by the same developers:
