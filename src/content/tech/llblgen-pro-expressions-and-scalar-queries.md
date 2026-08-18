---
title: "LLBLGen Pro Expressions and Scalar Queries"
summary: "Sometimes you need to reproduce monster queries in your code for display specific data or to serve data to reports."
date: 2009-09-22
tags:
  - "articles"
  - "code-snippets"
source: "http://www.llblgening.com/archive/2009/09/llblgen-pro-expressions-and-scalar-queries/"
sourceArchive: "https://web.archive.org/web/20100227024558/http://www.llblgening.com/archive/2009/09/llblgen-pro-expressions-and-scalar-queries/"
---
Sometimes you need to reproduce monster queries in your code for display specific data or to serve data to reports. In general I prefer to say that “I need certain set of data, so How can I fetch it” instead of “How can I write this query into LLBLGen Pro”. Anyway, sometimes we used to see the data as a result from a query, so it’s helpful to see the query that reproduces the resulset.

Today I will talk about LLBLGen Pro Expressions and how they are useful when building “kind of complex” query constructs like subqueries and make operations among them. I will use IExpression, ScalarQueryExpression and DbFunctionCall within a DynamicList as the target. The code is written in C#, LLBLGen Pro v2.6, Adapter Templaset, using AdvertureWorks DB (SQLServer 2005).

In this article:

- I just wanna see the code

- Alternatives

- Introduction to LLBLGen Pro Expressions

- Writing the code (LLBLGen Pro API version)

- Writing the code (LINQ2LLBL version)

- Conclusion

---

## I just wanna see the code

Just want to see the expected SQL and the LLBLGen Pro code? Here it is. If you want further details, please keep reading.

### Diagram

This is a small diagram centralized in Product table and the related involved tables.

### The problem

In our app we need to fetch some product info with the following requeriments:

- The basic product info

- The total cost of work orders

- The total amount of purchases

- The sales total

- All of that filtered before an specific date

- We want only sold products (there are sales before the specified date)

- The total cost of work orders and the total amount of purchases should be totalized in one field

- The results should be ordered by the most exciting product (+sales) to the less popular (-sales)

### Expected SQL

Considering the requeriments, an approximate sql query could look like the following.

```sql
DECLARE @ReferentialDate Datetime
SET @ReferentialDate = '20020101'

SELECT
	P.[ProductID],
	P.[Name],
	p.[ProductNumber],

	ISNULL(
		(SELECT SUM([ActualCost])
		 FROM
			[AdventureWorks].[Production].[WorkOrderRouting] WOR
			INNER JOIN [AdventureWorks].[Production].[WorkOrder] WO
				ON WO.WorkOrderID = WOR.WorkOrderID
		 WHERE
			EndDate <= @ReferentialDate
			AND WO.ProductID = P.[ProductId]
		)
	, 0)

	+

	ISNULL(
		(SELECT SUM([OrderQty] * [UnitPrice])
		 FROM [AdventureWorks].[Purchasing].[PurchaseOrderDetail] POD
			INNER JOIN [AdventureWorks].[Purchasing].[PurchaseOrderHeader] POH
				ON POH.PurchaseOrderId = POD.PurchaseOrderID
		 WHERE OrderDate <= @ReferentialDate
			AND POD.ProductID = P.[ProductId])
	, 0) AS TotalPurchased,

	ISNULL(
		(SELECT SUM([OrderQty] * ([UnitPrice] * (1 - [UnitPriceDiscount])))
		 FROM [AdventureWorks].[Sales].[SalesOrderDetail] SOD
			INNER JOIN [AdventureWorks].[Sales].[SalesOrderHeader] SOH
				ON SOH.SalesOrderId = SOD.SalesOrderId
			INNER JOIN [AdventureWorks].[Sales].[SpecialOfferProduct] SOFP
				ON SOFP.SpecialOfferID = SOD.SpecialOfferID
				AND SOFP.ProductID = SOD.ProductID
		 WHERE
			OrderDate <= @ReferentialDate
			AND SOFP.ProductID = P.[ProductId])
	, 0) AS TotalSold

FROM
	[AdventureWorks].[Production].[Product] P

WHERE
	ISNULL(
		(SELECT SUM([OrderQty] * ([UnitPrice] * (1 - [UnitPriceDiscount])))
		 FROM [AdventureWorks].[Sales].[SalesOrderDetail] SOD
			INNER JOIN [AdventureWorks].[Sales].[SalesOrderHeader] SOH
				ON SOH.SalesOrderId = SOD.SalesOrderId
			INNER JOIN [AdventureWorks].[Sales].[SpecialOfferProduct] SOFP
				ON SOFP.SpecialOfferID = SOD.SpecialOfferID
				AND SOFP.ProductID = SOD.ProductID
		 WHERE
			OrderDate <= @ReferentialDate
			AND SOFP.ProductID = P.[ProductId])
	, 0) > 0

ORDER BY TotalSold DESC
```

### LLBLGen Pro code

The following code gives us what we need

```csharp
// date to filter
DateTime referentialDate = new DateTime(2002, 1, 1);

// -- PREPARE THE EXPRESSIONS TO USE --

// Total Work Order Cost
IExpression totalWorkOrderCostExp = new ScalarQueryExpression(
    WorkOrderRoutingFields.ActualCost.SetAggregateFunction(AggregateFunction.Sum),
    WorkOrderFields.EndDate <= referentialDate
        & WorkOrderFields.ProductId == ProductFields.ProductId,
    new RelationCollection(WorkOrderRoutingEntity.Relations.WorkOrderEntityUsingWorkOrderId) );

IExpression totalWorkOrderCostIsNullWrapperExp = new DbFunctionCall("ISNULL",
    new object[]{ totalWorkOrderCostExp, 0 });

// Total Purchased
IExpression purchaseLineTotalExp = new Expression(PurchaseOrderDetailFields.OrderQty, ExOp.Mul,
    PurchaseOrderDetailFields.UnitPrice);

IExpression totalPurchasedExp = new ScalarQueryExpression(
    new EntityField2("LineTotal", purchaseLineTotalExp, AggregateFunction.Sum),
    PurchaseOrderFields.OrderDate <= referentialDate
        & PurchaseOrderDetailFields.ProductId == ProductFields.ProductId,
    new RelationCollection(PurchaseOrderDetailEntity.Relations.PurchaseOrderEntityUsingPurchaseOrderId) );

IExpression totalPurchasedIsNullWrapperExp = new DbFunctionCall("ISNULL",
    new object[]{ totalPurchasedExp, 0 });

// (Total Work Order Cost + Total Purchased)
IExpression totalWorkOrderTotalAndPurchased = new Expression(
    totalWorkOrderCostIsNullWrapperExp, ExOp.Add, totalPurchasedIsNullWrapperExp);

// Sold Total
IExpression soldLineTotalExp = new Expression(SalesOrderDetailFields.OrderQty, ExOp.Mul,
    new Expression(SalesOrderDetailFields.UnitPrice, ExOp.Mul,
        new Expression(1, ExOp.Sub, SalesOrderDetailFields.UnitPriceDiscount)));

// sales relations
IRelationCollection soldRelations = new RelationCollection();
soldRelations.Add(SalesOrderDetailEntity.Relations.SpecialOfferProductEntityUsingSpecialOfferIdProductId);
soldRelations.Add(SalesOrderDetailEntity.Relations.SalesOrderEntityUsingSalesOrderId);

IExpression totalSoldExp = new ScalarQueryExpression(
    new EntityField2("LineTotal", soldLineTotalExp, AggregateFunction.Sum),
    SalesOrderFields.OrderDate <= referentialDate
        & SpecialOfferProductFields.ProductId == ProductFields.ProductId,
    soldRelations );

IExpression totalSoldIsNullWrapperExp = new DbFunctionCall("ISNULL",
    new object[]{ totalSoldExp, 0 });

// build the DynamicList
ResultsetFields fields = new ResultsetFields(5);
fields.DefineField(ProductFields.ProductId, 0);
fields.DefineField(ProductFields.Name, 1);
fields.DefineField(ProductFields.ProductNumber, 2);
fields.DefineField(new EntityField2("TotalWorkOrderAndPurchased", totalWorkOrderTotalAndPurchased), 3);
fields.DefineField(new EntityField2("TotalSold", totalSoldIsNullWrapperExp), 4);

// only sold products
IRelationPredicateBucket filterBucket = new RelationPredicateBucket();
filterBucket.PredicateExpression.Add((EntityField2)fields[4] > 0);

// we want the most exiting product first
ISortExpression sorter = new SortExpression((EntityField2)fields[4] | SortOperator.Descending);

// fetch
DataTable results = new DataTable();
using (DataAccessAdapter adapter = new DataAccessAdapter())
{
    adapter.FetchTypedList(fields, results, filterBucket, 0, sorter, false);
}
```

---

## Alternatives

Before we continue, please note that sometimes is more convenient to have this written in DB. It will depends on your scenario and preferences. Some people like to do this in LLBLGen so they don’t depend on DB-side code. Others prefer to have complex things on DB-side, and others (f.i. old MySql version users) don’t have the chance to write this on a DB view or DB stored procedure, so they have to implement things in LLBLGen/.Net code. Anyway, be aware that you have other options:

- Use [TypedViews](http://www.llblgen.com/documentation/2.6/hh_goto.htm#Using%20the%20generated%20code/Adapter/Using%20TypedViews%2C%20TypedLists%20and%20Dynamic%20Lists/gencode_usingtypedview_adapter.htm)(mapped DB views)

- [Stored Procedures](http://www.llblgen.com/documentation/2.6/hh_goto.htm#Using%20the%20generated%20code/Adapter/gencode_callingstoredprocedure_adapter.htm)

- [LINQ2LLBL](http://www.llblgen.com/documentation/2.6/hh_goto.htm#Using%20the%20generated%20code/Linq/gencode_linq_gettingstarted.htm)

---

## Introduction to LLBLGen Pro Expressions

### What are they

Expressions are objects which specify a graph of nested actions which are executed in the database during a query. Expressions allow you to specify powerful operations on fields which would otherwise require a stored procedure or view or a lot of entity processing outside of the database. Expression objects can be re-used, which makes them ideal objects for caching in your application so you don’t have to write a lot of code to perform common operations. In other words, expressions are just great.

### What do Expressions can do for me?

You can use expression in select lists, in updates and in predicates. You can perform operations between expressions and fields, between expressions and values or between expressions. you can nest them, reuse them, combine them.

### IExpression

IExpression is the interface for LLBLGen Pro expression elements. The typical implementations of IExpression are:

- **Expression**: Allows you to write a general expression.

- **DBFunctionCall**: To call DB-side functions

- **ScalarQueryExpression**: To write subqueries

### Expression operations

You can perform the following operations between expressions and fields, expressions and expressions, expressions and values: Add, Sub, Mul, Div, Mod, Equal, GreaterEqual, GreaterThan, LessEqual, LessThan, NotEqual, And, Or, BitwiseAnd, BitwiseOr and BitwiseXor.

---

## Writing the code (LLBLGen Pro API version)

It’s a large query so we are gonna divide and conquer.

We will fetch the data into a [DynamicList](http://www.llblgen.com/documentation/2.6/hh_goto.htm#Using%20the%20generated%20code/Adapter/Using%20TypedViews%2C%20TypedLists%20and%20Dynamic%20Lists/gencode_usingdynamiclists_adapter.htm). First of all we will prepare the Expressions so they would be ready when we construct or DynamicList.

### Total Work Order Cost

```csharp
// Total Work Order Cost
IExpression totalWorkOrderCostExp = new ScalarQueryExpression(
    WorkOrderRoutingFields.ActualCost.SetAggregateFunction(AggregateFunction.Sum),
    WorkOrderFields.EndDate <= referentialDate
        & WorkOrderFields.ProductId == ProductFields.ProductId,
    new RelationCollection(WorkOrderRoutingEntity.Relations.WorkOrderEntityUsingWorkOrderId) );

IExpression totalWorkOrderCostIsNullWrapperExp = new DbFunctionCall("ISNULL",
    new object[]{ totalWorkOrderCostExp, 0 });
```

At line 6 we construct the `ScalarQueryExpression`. Will explain each parameter:

`WorkOrderRoutingFields.ActualCost.SetAggregateFunction(AggregateFunction.Sum)`is the field we will aggregate. In this case we are summarizing the ActualCost of the WorkOrderRoutings.

Line 8 is the predicate. We are filtering all work orders that were placed before some date (referentialDate) and we are saying that the involved product must match the product in the outer query (`Product`).

Finally, the line `new RelationCollection(WorkOrderRoutingEntity.Relations.WorkOrderEntityUsingWorkOrderId)` is required as we are filtering on a different entity that the aggregated one, we must provide the respective relation, that way the generated sql will produce a join in the subquery.

At line 13 we are wrapping the expression into a `DBFuncionCall` (another expression) to emit a `ISNULL`function call.

### Total Purchased

```csharp
// Total Purchased
IExpression purchaseLineTotalExp = new Expression(PurchaseOrderDetailFields.OrderQty, ExOp.Mul,
    PurchaseOrderDetailFields.UnitPrice);

IExpression totalPurchasedExp = new ScalarQueryExpression(
    new EntityField2("LineTotal", purchaseLineTotalExp, AggregateFunction.Sum),
    PurchaseOrderFields.OrderDate <= referentialDate
        & PurchaseOrderDetailFields.ProductId == ProductFields.ProductId,
    new RelationCollection(PurchaseOrderDetailEntity.Relations.PurchaseOrderEntityUsingPurchaseOrderId) );

IExpression totalPurchasedIsNullWrapperExp = new DbFunctionCall("ISNULL",
    new object[]{ totalPurchasedExp, 0 });
```

This snippet is very similar to the _Total Work Order Cost_. There is a little difference though: we must perform a calculation before.

In `Expression purchaseLineTotalExp = new Expression(PurchaseOrderDetailFields.OrderQty, ExOp.Mul, PurchaseOrderDetailFields.UnitPrice);` we are calculating the line total `(Qty * UnitPrice)`. It is an example of a `Field * Field` expression.

Next, in line 20, we are creating the `ScalarQueryExpression`. As we need to pass a `EntityField2`, we create one on the fly with the previos expression (we can create fields like that for this purpose. Cool eh!), then we apply a sum aggregate to the field.

The rest is similar to the previos snippet (_Total Work Order Cost_): specify the filter and the involved relation (remember, we are filtering in a related entity, not the same entity we use in the calculated expression). And, wrapping the expression in a final `DBFuncionCall`that will enclose the expression in a `ISNULL`function.

### Total Work Order Cost + Total Purchased

```csharp
// (Total Work Order Cost + Total Purchased)
IExpression totalWorkOrderTotalAndPurchased = new Expression(
    totalWorkOrderCostIsNullWrapperExp, ExOp.Add, totalPurchasedIsNullWrapperExp);
```

This is sweet and self-explained. We can just `Add`the two previous expressions into a new one.

### Sold Total

```csharp
// Sold Total
IExpression soldLineTotalExp = new Expression(SalesOrderDetailFields.OrderQty, ExOp.Mul,
    new Expression(SalesOrderDetailFields.UnitPrice, ExOp.Mul,
        new Expression(1, ExOp.Sub, SalesOrderDetailFields.UnitPriceDiscount)));

// sales relations
IRelationCollection soldRelations = new RelationCollection();
soldRelations.Add(SalesOrderDetailEntity.Relations.SpecialOfferProductEntityUsingSpecialOfferIdProductId);
soldRelations.Add(SalesOrderDetailEntity.Relations.SalesOrderEntityUsingSalesOrderId);

IExpression totalSoldExp = new ScalarQueryExpression(
    new EntityField2("LineTotal", soldLineTotalExp, AggregateFunction.Sum),
    SalesOrderFields.OrderDate <= referentialDate
        & SpecialOfferProductFields.ProductId == ProductFields.ProductId,
    soldRelations );

IExpression totalSoldIsNullWrapperExp = new DbFunctionCall("ISNULL",
    new object[]{ totalSoldExp, 0 });
```

In line 34 we are creating an expression that calculates the line total. Note that we need to do something like `(Qty * (UnitPrice * (1 - UnitPriceDiscount)))`. So we are nesting the expressions in one shot (Cool again  ).

Line 38. Now, to be able to filter on the `SalesOrder`entity we need to navigate through `SalesOrderDetail -> SalesOrder.` And to be able to filter the product we need to navigate through `SalesOrderDatil -> SpecialOfferProduct`. That is, two relations, so we create a RelationCollection we use in our `ScalarQueryExpression`.

The rest is the same: create a ScalarQueryExpression that receives the line total expression and indicating that we want a Sum, then passing the normal filter and relations we just created. Then wrap the final expression in a `ISNULL`db funcion call.

### Build the DynamicList, other stuff and Fetch

```csharp
// build the DynamicList
ResultsetFields fields = new ResultsetFields(5);
fields.DefineField(ProductFields.ProductId, 0);
fields.DefineField(ProductFields.Name, 1);
fields.DefineField(ProductFields.ProductNumber, 2);
fields.DefineField(new EntityField2("TotalWorkOrderAndPurchased", totalWorkOrderTotalAndPurchased), 3);
fields.DefineField(new EntityField2("TotalSold", totalSoldIsNullWrapperExp), 4);

// only sold products
IRelationPredicateBucket filterBucket = new RelationPredicateBucket();
filterBucket.PredicateExpression.Add((EntityField2)fields[4] > 0);

// we want the most exiting product first
ISortExpression sorter = new SortExpression((EntityField2)fields[4] | SortOperator.Descending);

// fetch
DataTable results = new DataTable();
using (DataAccessAdapter adapter = new DataAccessAdapter())
{
    adapter.FetchTypedList(fields, results, filterBucket, 0, sorter, false);
}
```

If you are familiar with DynamicList this should be easy. If not please [take a look at the manual](http://www.llblgen.com/documentation/2.6/hh_goto.htm#Using%20the%20generated%20code/Adapter/Using%20TypedViews%2C%20TypedLists%20and%20Dynamic%20Lists/gencode_usingdynamiclists_adapter.htm).

Line 52. Basically we are defining the fields we want to retrieve. First some Product fields and then the special ones. We create EntityField2 objects on the fly for those calculated fields. Those entities are created with the final expressions we just built.

Line 60. Define the filter. In this case we just want sold products (at least one sell). We just take the involved field (_fields[4]_) and create the filter with that. The same for the sorter (Line 64).

The rest is just a fetch routine.

---

## Writing the code (LINQ2LLBL version)

For you LINQ fans, here is one [LINQ2LLBL](http://www.llblgen.com/documentation/2.6/hh_goto.htm#Using%20the%20generated%20code/Linq/gencode_linq_gettingstarted.htm)approach to obtain the data we need:

```csharp
// date to filter
DateTime referentialDate = new DateTime(2002, 1, 1);

using (DataAccessAdapter adapter = new DataAccessAdapter())
{
    LinqMetaData metaData = new LinqMetaData(adapter);
    var q = (from p in metaData.Product

             select new
             {
                 ProductId = p.ProductId,
                 Name = p.Name,
                 ProductNumber = p.ProductNumber,

                 TotalWorkCost =

                     p.WorkOrders.Where(wof => wof.EndDate <= referentialDate)
                         .Sum(wo => wo.WorkOrderRoutings
                             .Sum(wor => wor.ActualCost.Value)),

                 TotalPurchased =
                     p.PurchaseOrderDetails.Where(podf => podf.PurchaseOrder.OrderDate <= referentialDate)
                         .Sum(pod => pod.UnitPrice * pod.OrderQty),

                 TotalSold = p.SpecialOffers.Sum(
                     sof => sof.SalesOrderDetail
                             .Where(sodf => sodf.SalesOrder.OrderDate <= referentialDate)
                                 .Sum(sod => sod.OrderQty * sod.UnitPrice * Decimal.Subtract(1, sod.UnitPriceDiscount)))
             })

            .Where(fr => fr.TotalSold > 0)
            .OrderByDescending(fro => fro.TotalSold);

    var results = q.ToList();
}
```

Cool as well!
 We are talking about LLBLGen Pro Expressions, so I wont swim into this snippet now. It’s just to demostrate that you have a lot of options to resolve this situation.

---

## Conclusion

Expressions are objects which specify a graph of nested actions which are executed in the database during a query. Expressions allow you to specify powerful operations on fields which would otherwise require a stored procedure or view or a lot of entity processing outside of the database.

You can produce almost any sql code using LLBLGen Pro framework.

If the process would become cumbersome you have another options: [TypedViews](http://www.llblgen.com/documentation/2.6/hh_goto.htm#Using%20the%20generated%20code/Adapter/Using%20TypedViews%2C%20TypedLists%20and%20Dynamic%20Lists/gencode_usingtypedview_adapter.htm), [Stored Procedures](http://www.llblgen.com/documentation/2.6/hh_goto.htm#Using%20the%20generated%20code/Adapter/gencode_callingstoredprocedure_adapter.htm), [LINQ2LLBL](http://www.llblgen.com/documentation/2.6/hh_goto.htm#Using%20the%20generated%20code/Linq/gencode_linq_gettingstarted.htm).



Tags: [adapter](https://web.archive.org/web/2012/http://www.llblgening.com/archive/tag/adapter/), [dynamiclist](https://web.archive.org/web/2012/http://www.llblgening.com/archive/tag/dynamiclist/), [expressions](https://web.archive.org/web/2012/http://www.llblgening.com/archive/tag/expressions/), [linq2llbl](https://web.archive.org/web/2012/http://www.llblgening.com/archive/tag/linq2llbl/)


				<p class="

> 1 of this post's 1 figures were not preserved by the Internet Archive and are missing here.

