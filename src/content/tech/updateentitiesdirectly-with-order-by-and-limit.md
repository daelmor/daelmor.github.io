---
title: "UpdateEntitiesDirectly with ORDER-BY and LIMIT (MySql specific)"
summary: "Have you ever needed to perform an update over an odered-limited subset in MySql? Do you use LLBLGenPro but you can’t figure out how to perform such update?"
date: 2009-08-25
tags:
  - "code-snippets"
source: "http://www.llblgening.com/archive/2009/08/updateentitiesdirectly-with-order-by-and-limit-mysql-specific/"
sourceArchive: "https://web.archive.org/web/20100131042338/http://www.llblgening.com/archive/2009/08/updateentitiesdirectly-with-order-by-and-limit-mysql-specific/"
---
Have you ever needed to perform an update over an odered-limited subset in MySql? Do you use LLBLGenPro but you can’t figure out how to perform such update?

If the answer is yes, then keep reading. As no all databases supports such update syntaxis, LLBLGen don’t have this built-in. In this example I’ll try to explain (briefly) how to put custom code to get this done. I’ll use Adapter and C#.

### 1. Extend DataAccessAdapter class

Create a partial class of DataAccessAdapter and put it in your DBSpecific project. We also write some class member stuff we will use further.

```csharp
using SD.LLBLGen.Pro.ORMSupportClasses;
using SD.LLBLGen.Pro.DQE.MySql;
namespace NW.DatabaseSpecific
{
     public partial class DataAccessAdapter
     {
        // sorter to use on a batch update query (for MySql queries)
        private ISortExpression _updateEntitiesDirectlySorter;

        // the limit of the batch update query (for MySql queries)
        private int _updateEntitiesDirectlyLimit;
     }
}
```

### 2. Trap the updateQuery before it is executed

To obtain and manipulate the updateQuery we must override the OnUpdateEntitiesDirectly method. This method is called right before the actual update query is executed. So we will inject our specific clauses in the query. We just use the variables (_updateEntitiesDirectlySorter and _updateEntitiesDirectlyLimit), don’t worry about the actual value of them, we will see that in step 3. Now the code, you need to put this on the partial class we just created (step 1).

```csharp
protected override void OnUpdateEntitiesDirectly(IActionQuery updateQuery)
{
    // call the base method
    base.OnUpdateEntitiesDirectly(updateQuery);

    int i = 0;
    // add the ORDER BY clause (if applicable)
    if (_updateEntitiesDirectlySorter != null)
    {
        // prepare the sortExpression object
        MySqlSpecificCreator dqe = new MySqlSpecificCreator();
        _updateEntitiesDirectlySorter.DatabaseSpecificCreator = dqe;
        InsertPersistenceInfoObjects(_updateEntitiesDirectlySorter);

        // add the ORDER BY clause
        updateQuery.Command.CommandText +=
         string.Format(" ORDER BY {0}", _updateEntitiesDirectlySorter.ToQueryText(ref i));
    }

    // add the LIMIT clause (if applicable)
    if (_updateEntitiesDirectlyLimit > 0)
    {
        updateQuery.Command.CommandText +=
        string.Format(" LIMIT {0}", _updateEntitiesDirectlyLimit);
    }
}
```

The code is self-descriptive: if there is an ORDER-BY clause to add, then use it, the same for the LIMIT clause.

### 3. Overloads UpdateEntitiesDirectly

Now we will overload the UpdateEntitiesDirectly method so you can use it at your code and pass your custom sorter and limit parameters. Very straight-forward:

```csharp
public int UpdateEntitiesDirectly(IEntity2 entityWithNewValues,
    IRelationPredicateBucket filterBucket, ISortExpression sorter, int limit)
{
    // update the parameters for the query
    _updateEntitiesDirectlySorter = sorter;
    _updateEntitiesDirectlyLimit = limit;

    int rc = 0;
    try
    {
        // persist the batch update query
        rc = UpdateEntitiesDirectly(entityWithNewValues, filterBucket);
    }
    finally
    {
        // reset the private custom variables
        _updateEntitiesDirectlySorter = null;
        _updateEntitiesDirectlyLimit = 0;
    }
    return rc;
}
```

Simply: set the parameters (sorter and limit), execute the query, clean stuff, return the number of affected rows.

Now compile the DBSpecific project.

### 4. Use it in your code

```csharp
// new values
FilmEntity newValues = new FilmEntity();
newValues.Deprecated = true;

// sorter
ISortExpression sorter = new SortExpression();
sorter.Add(FilmFields.RentalRate | SortOperator.Ascending);

// limit. we only want to update the first 5
int maxItemsToUpdate = 5;

// filter. just update the 'PG' movies
IRelationPredicateBucket filter = new RelationPredicateBucket(FilmFields.Rating == "PG");

// our new update method
int updatedItems = 0;
using (DataAccessAdapter adapter = new DataAccessAdapter())
{
    updatedItems = adapter.UpdateEntitiesDirectly(newValues, filter, sorter, maxItemsToUpdate);
}
```

Easy eh! Now you know how to trap some actionQuery, inject custom code and overloads DataAccessAdapter methods. The same applies for DeleteEntitiesDirectly.

[Click here to download the sourcecode](https://web.archive.org/web/2012/http://www.llblgening.com/downloads/2009/08/MySqlDataAccessAdapterExtended.cs) (include _UpdateEntitiesDirectly_and _DeleteEntitiesDirectly_).



Tags: [adapter](https://web.archive.org/web/2012/http://www.llblgening.com/archive/tag/adapter/), [mysql](https://web.archive.org/web/2012/http://www.llblgening.com/archive/tag/mysql/)


				<p class="
