---
id: '1'
title: Purpose
tags: []
---
**The purpose of this card is so that in POSTman, etc I will be able to add Molecules.**

```A Molecule is simply a collection of files.```

```It has a unique key/id, a hash of all of the files it contains, and a generated index file.```


So I think the flow will look something like this:
  1) Frontend is used to create molecule, choose files to upload etc.
  2) Files are sent to strapi-plus/upload endpoint, which returns the url to the files, as well as shortLinks.
  3) Frontend bundles this stuff together, generates an index file and sends to strapi-plus/upload endpoint.
  4) Final shortLink is sent back to the frontend, which returns it to the user.