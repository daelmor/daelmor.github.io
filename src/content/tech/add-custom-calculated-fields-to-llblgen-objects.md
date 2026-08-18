---
title: "Add custom calculated fields to LLBLGen objects"
summary: "Did you ever wanted to add custom fields to your LLBLGen objects based on some especial expression? Is such expression impossible to build in memory so you want it be query based? Well we will address it a little bit today."
date: 2009-09-08
tags:
  - "code-snippets"
source: "http://www.llblgening.com/archive/2009/09/add-custom-calculated-fields-to-llblgen-objects/"
sourceArchive: "https://web.archive.org/web/20100101105508/http://www.llblgening.com/archive/2009/09/add-custom-calculated-fields-to-llblgen-objects/"
---
Did you ever wanted to add custom fields to your LLBLGen objects based on some especial expression? Is such expression impossible to build in memory so you want it be query based? Well we will address it a little bit today.

Topics on this post:

- Adding custom calculated field to TypedLists

- Adding custom calculated field to TypedViews

When I say LLBLGen objects that means Entities, TypedLists and TypedViews. I wont discuss entities, as [Frans explained very well here](http://weblogs.asp.net/fbouma/archive/2006/06/09/LLBLGen-Pro-v2.0-with-ASP.NET-2.0.aspx) (see Step 6 – Extending EntityFactory).

So, we will focus on TypedLists and TypedViews. I will use C#, Adapter and AdventureWorks2008 database.

---

## Adding custom calculated fields to TypedLists

TypedLists are LLBLGen objects that targets typed DataTables, are constructed using existing entity fields. ([read more about TypedLists](http://www.llblgen.com/documentation/2.6/hh_goto.htm#Using%20the%20generated%20code/Adapter/Using%20TypedViews%2C%20TypedLists%20and%20Dynamic%20Lists/gencode_usingtypedlist_adapter.htm)).

Now, consider this: you construct a TypedList to fetch SalesPerson data like the image below:

Ok, then for some reason you want the TypedList also reflects the number of orders such person sold. So you would want a new column like so:

```sql
SELECT
sp.*,
(SELECT COUNT(*) FROM Sales.SalesOrderHeader o WHERE  o.SalesPersonID = sp.BusinessEntityID)

FROM Sales.vSalesPerson sp
```

Ok. These are the steps to add such new field:

### 1. At your DBSpecific generated code project, add a partial class for the involved TypedList (here, SalesPersonTypedList).

using System.Data;
 using AW.HelperClasses;
 using SD.LLBLGen.Pro.ORMSupportClasses;

```csharp
namespace AW.TypedListClasses
{
    public partial class SalesPersonTypedList
    {
    }
}
```

### 2. Add a new column variable to the class that represent the new column.

```csharp
// new column
DataColumn _columnTotalSales;
```

### 3. Override OnResulsetBuilt, expand the fields collection and add your desire expression there.

```csharp
protected override void OnResultsetBuilt(IEntityFields2 fields)
{
     // expand fields and efine the new one
     fields.Expand(1);
     fields.DefineField(new EntityField2("TotalSales",
     new ScalarQueryExpression(SalesOrderFields.SalesOrderId.SetAggregateFunction(AggregateFunction.Count),
          (SalesOrderFields.SalesPersonId == SalesPersonFields.BusinessEntityId))), fields.Count - 1);

     base.OnResultsetBuilt(fields);
}
```

It’s important to note that we are expanding the fields collection, otherwise we will get runtime errors. Next at line 5 we define our expression using ScalarQueryExpression but you can add a DBFuncionCall, sum two fields, etc.

### 4. Initialize the Column so the TypedList (which is a DataTable) can use it in your user-code, databinding, etc.

```csharp
protected override void OnInitialized()
{
    // create the corresponding column
    _columnTotalSales = new DataColumn("TotalSales", typeof(System.Int32), null, MappingType.Element);
    _columnTotalSales.ReadOnly = true;
    Columns.Add(_columnTotalSales);

    base.OnInitialized();
}

// the property that access the column
internal DataColumn TotalSales
{
    get { return _columnTotalSales; }
}
```

The first method add the column to the DataTable.Columns collection and then on the TotalSales property we are exposing such column to the rows of the TypedList.

At this step we are done with the TypedList partial class.

### 5. Add a partial class for the SalesPersonRow (this class represent the each instance row of our SalesPersonTypedList) and add the following code:

```csharp
public partial class SalesPersonRow
{
    public System.Int32 TotalSales
    {
        get
        {
            if (IsTotalSalesNull())
            {
                // return default value for this type.
                return (System.Int32)TypeDefaultValue.GetDefaultValue(typeof(System.Int32));
            }
            else
            {
                return (System.Int32)this[_parent.TotalSales];
            }
        }
        set
        {
            this[_parent.TotalSales] = value;
        }
    }

    public bool IsTotalSalesNull()
    {
        return IsNull(_parent.TotalSales);
    }
}
```

The first property expose the value of the column to the row instances of the TypedLists. The second check whether the column is null.

That’s it. Now be happy fetching your new enhanced SalesPersonTypedList:

```csharp
[TestMethod]
public void FetchExtendedTypedList()
{
    // the TypedList to fill
    SalesPersonTypedList salesPeople = new SalesPersonTypedList();

    // fetch
    using (IDataAccessAdapter adapter = new DataAccessAdapter())
    {
        adapter.FetchTypedList(salesPeople);
    }

    // tests
    Assert.IsNotNull(salesPeople);
    Assert.IsTrue(salesPeople.Count > 0);
    Assert.IsNotNull(salesPeople[0].TotalSales);
    Assert.AreEqual(48, salesPeople[0].TotalSales);
}
```

---

## Adding custom calculated fields to TypedViews

A Typed View definition is a 1:1 mapping of a database view on an element in an LLBLGen Pro project. A typed view contains, for each database view column, a field with the same name or the name you gave it. When the typed view element is generated into code, it will end up as a class derived (indirectly) from DataTable, a typed DataTable to be exact, which is usable as a read-only list. ([quoted from LLBLGen Manual](http://www.llblgen.com/documentation/2.6/hh_goto.htm#Using%20the%20generated%20code/Adapter/Using%20TypedViews%2C%20TypedLists%20and%20Dynamic%20Lists/gencode_usingtypedview_adapter.htm)).

Now consider we have a database view mapped on LLBLGen (see image below) that shows the SalesPerson info&#8230;

 &#8230; and we want to add a new column that represent the number of sales of that SalesPerson. We need some column that execute some like this query:

```sql
SELECT
sp.*,
(SELECT COUNT(*) FROM Sales.SalesOrderHeader o WHERE  o.SalesPersonID = sp.BusinessEntityID)

FROM Sales.vSalesPerson sp
```

Well, lets start.

### 1. At your DBSpecific generated code project, add a partial class for the involved TypedView (here, VSalesPersonTypedView).

using System.Data;
 using AW.HelperClasses;
 using SD.LLBLGen.Pro.ORMSupportClasses;

```csharp
namespace AW.TypedViewClasses
{
    public partial class VSalesPersonTypedVew
    {
    }
}
```

### 2. Add a new column variable to the class that represent the new column.

```csharp
// new column
DataColumn _columnTotalSales;
```

### 3. Override OnInitialized method, expand the fields collection, add your desire expression there and define the new column on the DataTable’s columns.

```csharp
protected override void OnInitialized()
{
     // expand fields and efine the new one
     _fields.Expand(1);
     _fields.DefineField(new EntityField2("TotalSales",
     new ScalarQueryExpression(SalesOrderFields.SalesOrderId.SetAggregateFunction(AggregateFunction.Count),
          (SalesOrderFields.SalesPersonId == VSalesPersonFields.BusinessEntityId ))), _fields.Count - 1);

     // create the corresponding column
     _totalSales = new DataColumn("TotalSales", typeof(System.Int32), null, MappingType.Element);
     _totalSales.ReadOnly = true;
     Columns.Add(_totalSales);

     base.OnInitialized();
}
```

It’s important to note that we are expanding the fields collection, otherwise we will get runtime errors. Next at line 5 we define our expression using ScalarQueryExpression but you can add a DBFuncionCall, sum two fields, etc.
 Next at line 9, we initialized the Column so the TypedList (which is a DataTable) can use it in your user-code, databinding, etc.

### 4. Create a property for the new column.

```csharp
// the property that access the column
internal DataColumn TotalSales
{
    get { return _columnTotalSales; }
}
```

Here on TotalSales property we are exposing such column to the rows of the TypedView.

At this step we are done with the VTypedView partial class.

### 5. Add a partial class for the VSalesPersonRow (this class represent the each instance row of our VSalesPersonTypedView) and add the following code:

```csharp
public partial class VSalesPersonRow
{
    public System.Int32 TotalSales
    {
        get
        {
            if (IsTotalSalesNull())
            {
                // return default value for this type.
                return (System.Int32)TypeDefaultValue.GetDefaultValue(typeof(System.Int32));
            }
            else
            {
                return (System.Int32)this[_parent.TotalSales];
            }
        }
        set
        {
            this[_parent.TotalSales] = value;
        }
    }

    public bool IsTotalSalesNull()
    {
        return IsNull(_parent.TotalSales);
    }
}
```

The first property expose the value of the column to the row instances of the TypedView. The second check whether the column is null.

That’s it. Now be happy fetching your new enhanced VSalesPersonTypedView:

```csharp
[TestMethod]
public void FetchExtendedTypedView()
{
    VSalesPersonTypedView salesPeople = new VSalesPersonTypedView();
    DataTable dt = new DataTable();

    // fetch
    using (IDataAccessAdapter adapter = new DataAccessAdapter())
    {
        // after this we will have a filled datatable with values
        adapter.FetchTypedList(salesPeople.GetFieldsInfo(), dt, null);

        // if you want to use your typedView instead, just merge the results
        salesPeople.Merge(dt);
    }

    // tests
    Assert.IsNotNull(salesPeople);
    Assert.IsTrue(salesPeople.Count > 0);
    Assert.IsNotNull(salesPeople[0].TotalSales);
    Assert.AreEqual(48, salesPeople[0].TotalSales);
}
```

Important: Note that we are fetching the results via **FetchTypedList**instead of **FetchTypedView**. This is because the new column added doesn’t have any related persistence info, that doesn’t happen to TypedLists that are based on entity fields. So, we need to fetch that way, otherwise you will get some runtime exceptions. So our results are populated onto the dt (that is a DataTable). However, as you can see we are filling the results into a VSalesPersonTypedView via Merge, so at the end of the code we have a VSalesPersonTypedView filled with the fields _plus_ our new calculated field



Tags: [adapter](https://web.archive.org/web/2012/http://www.llblgening.com/archive/tag/adapter/), [typedlist](https://web.archive.org/web/2012/http://www.llblgening.com/archive/tag/typedlist/), [typedview](https://web.archive.org/web/2012/http://www.llblgening.com/archive/tag/typedview/)


				<p class="

> 2 of this post's 2 figures were not preserved by the Internet Archive and are missing here.

