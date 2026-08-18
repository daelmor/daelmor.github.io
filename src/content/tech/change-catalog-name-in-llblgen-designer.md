---
title: "Change database name (catalog name) in LLBLGen Designer"
summary: "Consider this: you have LLBLGen projects working and everything is just nice, life is beautiful. Then your DBA, for some reason, change the name of the database. How do you manage this as LLBLGen user?"
date: 2009-09-02
tags:
  - "articles"
source: "http://www.llblgening.com/archive/2009/09/change-catalog-name-llblgen-designer/"
sourceArchive: "https://web.archive.org/web/20090923143956/http://www.llblgening.com/archive/2009/09/change-catalog-name-llblgen-designer/"
---
Consider this: you have LLBLGen projects working and everything is just nice, life is beautiful. Then your DBA, for some reason, change the name of the database. How do you manage this as LLBLGen user?

At runtime you can use [Catalog Name Overwriting](http://llblgen.com/documentation/2.6/hh_goto.htm#Using%20the%20generated%20code/gencode_applicationconfiguration.htm%23catalognameoverwriting) but What about LLBLGen Desinger? How do you refresh changes from your database if the database name changed? Well, this is [briefly mentioned at docs](http://llblgen.com/documentation/2.6/hh_goto.htm#Using%20the%20designer/designer_refreshing.htm%23singlecatalogattended), but for some reason users can’t figure this out, so I will try to explain it a little bit more.

**1.**In LLBLGen Desinger, find the **Catalog Explorer** toolbox. Note that I didn’t say _Project Explorer_ but **CatalogExplorer**.

**2.** **Right click** on the Catalog you are interested in and click **Rename**.

**3.** Write down the new name of the database.

Done! As you can see, the catalog was renamed on _Project Explorer_.

&#8230;and when you refresh catalogs, the new catalog name is used.

That’s it. DBAs and LLBLGen users are friends again.



Tags: [designer catalog](https://web.archive.org/web/2012/http://www.llblgening.com/archive/tag/designer-catalog/)


				<p class="

> 5 of this post's 5 figures were not preserved by the Internet Archive and are missing here.

