---
title: "PrefetchPaths in Depth"
summary: "LLBLGen Pro has the ability to fetch related entities together with a set of entities, e.g. fetch a set of Customer entities and also their Order entities. This feature is called Prefetch Paths."
date: 2009-10-01
tags:
  - "articles"
  - "code-snippets"
source: "http://www.llblgening.com/archive/2009/10/prefetchpaths-in-depth/"
sourceArchive: "https://web.archive.org/web/20100301190843/http://www.llblgening.com/archive/2009/10/prefetchpaths-in-depth/"
---
LLBLGen Pro has the ability to fetch related entities together with a set of entities, e.g. fetch a set of Customer entities and also their Order entities. This feature is called _Prefetch Paths._

In this article I will explain how to use LLBLGen Pro PrefetchPaths. I divided its use in Cases so it would be easy to understand and combine cases. I know you love code so I included code snippets on each case using LLBLGen Pro API and LINQ2LLBL. Finally I will provide some tips to avoid common mistakes.

In this article I will use [LLBLGen v2.6](http://www.llblgen.com/defaultgeneric.aspx), Adapter TemplateSet, C#, and AdventureWorks database. The concepts and code snippets are easily portables to SelfServicing.

**In this article:**

- Introduction

- Coding PrefetchPaths

 CASE A (1-depth)

- CASE B (n-depth, 1-branch)

- CASE C (n-depth, n-branch)

- Combinations

- Filtering and sorting

- Common mistakes

- Other considerations

---

## Introduction

### What PrefetchPaths are?

I quote the [LLBLGen Pro PrefetchPath](http://www.llblgen.com/documentation/2.6/hh_goto.htm#Using%20the%20generated%20code/Adapter/gencode_prefetchpaths_adapter.htm) documentation’s section:

> Adapter doesn’t support load-on-demand, also known as ‘lazy loading’ like SelfServicing does. The reason for this is that Adapter is often used in a distributed scenario, so there is no connection with the server when related objects need to be read, this is an action which can then only be done on the server. This scenario requires that you pre-fetch all entities required on the client, before sending the entity (or entities) requested to the client. In the occasion where the client requested a graph of objects from the server, this could lead to a lot of queries. Say you want a collection of Order entities and also want to fetch their related Customer entities. Using normal code this would require for 50 order entities 51 queries: 1 for the Order entities and 50 for each Customer. This is solved by Prefetch Paths, which allow you to specify which objects to fetch together with the actual objects to fetch, using only one query per node in the path (here: 2 queries).

Be aware that PrefetchPaths don’t replace relations. Those are different things. You use PrefetchPaths when you want to fetch related objects together with the root entity(collection) you are fetching. You use relations when you want to sort/filter or related fields. In the query and OR/M point-of-view the Prefetch will query and fetch the related objects you want and then attach those related objects to the root(s) one(s). Relations will generate joins in the query so you can sort or filter the root resulset on related objects.

### Where they come from?

When LLBLGen Pro refresh your database schema it retrieves, among other things, the relations between your tables and map them as relations on your entities. When you generate code, those relations are generated as relations and as PrefetchPaths as well. Such PrefetchPaths objects are ready-to-use properties on your entities you can access. For example:

CustomerEntity.PrefetchPathSalesOrders

You can hide relations or add new ones in LLBLGen Pro Desinger ([read more](http://www.llblgen.com/documentation/2.6/hh_goto.htm#Using%20the%20designer/designer_addingentities.htm)).

### How to use PrefetchPaths

**The LLBLGen Pro API way**

This is how I call the first way. This consist of use the IPrefetchPath2 (or IPrefetchPath in the case of SelfServicing). The IPrefetchPath2 and IPrefetchPathElement2 have all you need to get this working. We will explain this further in the examples.

**The LINQ2LLBL way**

Since v2.6 LLBLGen Pro ships with[full Linq .Net3.5+ support](http://www.llblgen.com/documentation/2.6/hh_goto.htm#Using%20the%20generated%20code/Linq/gencode_linq_gettingstarted.htm). Full linq support means that any querying on LLBLGen Pro generated entities can be done through Linq constructs/queries (see more on the documentation). The sane applies to PrefetchPaths. There are two types of consturcts you can use when using LINQ2LLBL: PathEdges and Lambda expressions. Which would you use? that depends, but in general they are equivalent, so get stick with the one you like the most.

_**PathEdges**_

PathEdge is a specification of a new node which has to be fetched related to its parent, so it represents an edge in the path. PathEdge constructors accept 0 or more PathEdges as well, which are the related edges below the current node. PathEdge instances require a type specification for the type of entity they represent (which is fetched through the PathEdge), because developers are able to specify the prefetch path element filter by using Linq constructions ([keep reading the docs](http://www.llblgen.com/documentation/2.6/hh_goto.htm#Using%20the%20generated%20code/Linq/gencode_linq_prefetchpaths.htm)). Some good stuff here is that you can reuse your existing PrefetchPaths constructs and pass them to the PathEdge.

_**Lambda expressions**_

The PathEdge approach works OK, but if you want to go linq all-the-way, it can be a bit of a mixed bag: it contains LLBLGen Pro API elements, and not their Linq equivalents. The approach with Lambda expressions also uses the WithPath extension method, however it takes a Lambda expression which contains the full path ([more info](http://www.llblgen.com/documentation/2.6/hh_goto.htm#Using%20the%20generated%20code/Linq/gencode_linq_prefetchpaths.htm)).

### What about SelfServicing?

It might be not that obvious that you can use Prefetch Paths on SelfServicing due to its lazy-lodaing (loading-on-demand) nature. However it’s key you know the benefits in performance that using Prefetch Paths in your SelfServicing code could give you for some scenarios. Please [read the documentation about this](http://www.llblgen.com/documentation/2.6/hh_goto.htm#Using%20the%20generated%20code/SelfServicing/gencode_prefetchpaths.htm). And remember that all the code in this article is easily portable to SelfServicing: just use IPrefetchPath, PrefetchPath, IPrefetchPathElement and PrefetchPathElement classes, instead of IPrefetchPath2, PrefetchPath2, IPrefetchPathElement2 and PrefetchPathElement2.

### Conventions on this article

I will show some images that represent graphs. Here are their meaning:

- The red box represent the root entity, that is the entity we are fetching and to which we will attach the prefetchPath to fetch its related entities.

- The light green box represent one PrefetchPathElement, that is one node on the involved PrefetchPath.

- The green box represent some PrefetchPathElement that have more than one child. This is used in Case C.

---

## CASE A (1-depth)

This is the trivial case when you just add one element to the graph.

### Code

```csharp
// order to fetch
PurchaseOrderEntity myOrder = new PurchaseOrderEntity(4002);

// prepare prefetch (order -> shipMethod)
IPrefetchPath2 myOrderPath = new PrefetchPath2((int)EntityType.PurchaseOrderEntity);
myOrderPath.Add(PurchaseOrderEntity.PrefetchPathShipMethod);

// fetch the graph
adapter.FetchEntity(myOrder, myOrderPath);

// tests
Assert.IsNotNull(myOrder.ShipMethod);
Assert.AreEqual("OVERSEAS - DELUXE", myOrder.ShipMethod.Name);
```

In this code we are fetching just one entity (PurchaseOrder with PurchaseOrderId 4002).
 The constructor of the PrefetchPath receives a root entity. That is the entity we are already fetching (in this case PurchaseOrderEntity). It’s important that you pass the correct entity otherwise you would get a nice exception saying that the root entity is incorrect.

Above code includes some tests. Note that after we “fetch the graph” -that is, fetch the entity and its prefetchPath- we can easily access to the related ShipMethod object. If you don’t prefetch such graph, the ShipMethod related entity would be null.

### Code (LINQ2LLBL – PathEdges)

```csharp
LinqMetaData metaData = new LinqMetaData(adapter);
var q = (from o in metaData.PurchaseOrder
        where o.PurchaseOrderId == 4002
        select o)
            .WithPath(new PathEdge<ShipMethodEntity>(
                    PurchaseOrderEntity.PrefetchPathShipMethod))
            .First();
```

### Code (LINQ2LLBL – Lambda expressions)

```csharp
var q2 =(from o in metaData.PurchaseOrder
        where o.PurchaseOrderId == 4002
        select o)
            .WithPath(orderPath => orderPath.Prefetch(o => o.ShipMethod))
            .First();
```

**When the root target is a collection**

In the previous example we are fetching just one entity (the PurchaseOrder where PurchaseOrderId 4002). You of course can use the same concept to fetch an EntityCollection. You in fact, can use the same IPrefetchPath2 (they are reusable). The important thing is to initiate the path with the correct root entity. So in the rest of the article we will show just examples fetching one entity as target and its corresponding prefetch path, to see as a collection fetch, just change the target (EntityCollection instead of Entity).

Here is the same code that works with a collection fetch:

### Code

```csharp
// order collection to fetch
EntityCollection<PurchaseOrderEntity> myOrders = new EntityCollection<PurchaseOrderEntity>();

// prepare prefetch (order -> shipMethod)
IPrefetchPath2 myOrderPath = new PrefetchPath2((int)EntityType.PurchaseOrderEntity);
myOrderPath.Add(PurchaseOrderEntity.PrefetchPathShipMethod);

// fetch the graph
adapter.FetchEntityCollection(myOrders, null, myOrderPath);
```

### Code (LINQ2LLBL – PathEdges)

```csharp
LinqMetaData metaData = new LinqMetaData(adapter);
            var q = (from o in metaData.PurchaseOrder
                     select o)
                        .WithPath(new PathEdge<ShipMethodEntity>(
                                PurchaseOrderEntity.PrefetchPathShipMethod))
                        .ToList();
```

### Code (LINQ2LLBL – Lambda expressions)

```text
var q2 = (from o in metaData.PurchaseOrder
                      select o)
                        .WithPath(orderPath => orderPath.Prefetch(o => o.ShipMethod))
                        .ToList();
```

_**Two or more nodes on the 1st level**_

The same concept could be extended to include more than one node at the same level. The next image illustrates this:

So, you can add any number of related entities to the root (or any _PrefetchPathElement_, we will come into this shortly). While you don’t add the same element twice, everything will be just nice. Here is the code that fetch the above graph:

### Code

```csharp
// prepare prefetch (order -> shipMethod,  order -> employee)
IPrefetchPath2 myOrderPath = new PrefetchPath2((int)EntityType.PurchaseOrderEntity);
myOrderPath.Add(PurchaseOrderEntity.PrefetchPathShipMethod);
myOrderPath.Add(PurchaseOrderEntity.PrefetchPathEmployee);
```

### Code (LINQ2LLBL – PathEdges)

```csharp
var q = (from o in metaData.PurchaseOrder
         where o.PurchaseOrderId == 4002
         select o)
            .WithPath(
                new PathEdge<ShipMethodEntity>(
                    PurchaseOrderEntity.PrefetchPathShipMethod),
                new PathEdge<EmployeeEntity>(
                    PurchaseOrderEntity.PrefetchPathEmployee))
            .First();
```

### Code (LINQ2LLBL – PathEdges variant)

This is a modification of the above code. Note that we are passing a PrefetchPath object to the WithPath method extension. This demonstrates that the IPrefetchPats are totally reusable, even in path-edged linq2llbl code.

```csharp
var qq = (from o in metaData.PurchaseOrder
         where o.PurchaseOrderId == 4002
         select o).WithPath(myOrderPath).First();
```

### Code (LINQ2LLBL – Lambda expressions)

```csharp
var q2 = (from o in metaData.PurchaseOrder
          where o.PurchaseOrderId == 4002
          select o)
            .WithPath(orderPath => orderPath
                .Prefetch(o => o.ShipMethod)
                .Prefetch(o => o.Employee))
            .First();
```

---

## Case B (n-depth, 1-branch)

Now that we are experts in fetching one level, we are gonna try **SubPaths**. SubPaths allows you extend down the graph that you want to prefetch. Using SubPaths is very easy. Consider the following graph&#8230;

We want to fetch a specific _PurchaseOrderEntity_(the root entity) and we want to obtain also its related _PurchaseOrderDetail_entities. In addition, for each _PurchaseOrderDetail_in such _PurchaseOrder_we want to fetch its _ProductEntity_. This will make possible to navigate the graph in code.
 The following code fetch such graph:

### Code

```csharp
// order to fetch
PurchaseOrderEntity myOrder = new PurchaseOrderEntity(4002);

// prepare prefetch (order -> orderDetail -> product)
IPrefetchPath2 myOrderPath = new PrefetchPath2((int)EntityType.PurchaseOrderEntity);
myOrderPath.Add(PurchaseOrderEntity.PrefetchPathPurchaseOrderDetails)
    .SubPath.Add(PurchaseOrderDetailEntity.PrefetchPathProduct);

// fetch the graph
adapter.FetchEntity(myOrder, myOrderPath);

// tests
Assert.AreEqual(2, myOrder.PurchaseOrderDetails.Count);
Assert.IsNotNull(myOrder.PurchaseOrderDetails[0].Product);
Assert.AreEqual("SO-B909-M", myOrder.PurchaseOrderDetails[0].Product.ProductNumber);
```

As you can see, the SubPath class is on the PrefetchPathElement. The tests shows that this work great, we can navigate trhough the graph.

### Code (LINQ2LLBL – PathEdges)

```csharp
LinqMetaData metaData = new LinqMetaData(adapter);
var q = (from o in metaData.PurchaseOrder
         where o.PurchaseOrderId == 4002
         select o)
            .WithPath(
                new PathEdge<PurchaseOrderDetailEntity>(
                    PurchaseOrderEntity.PrefetchPathPurchaseOrderDetails,
                        new PathEdge<ProductEntity>(
                            PurchaseOrderDetailEntity.PrefetchPathProduct)))
            .First();
```

Note that when you want to grow down in the graph using _PathEdges_you first create the _PathEdge_for the first node (_PurchaseOrderDetail_) then, as part of the constructor, you also pass the “children” of such edge. So in (psedo-code): _new PathEdge(node1, new PathEdge(child-node))_.

### Code (LINQ2LLBL – Lambda expressions)

```csharp
var q2 = (from o in metaData.PurchaseOrder
          where o.PurchaseOrderId == 4002
          select o)
            .WithPath(orderPath => orderPath
                .Prefetch<PurchaseOrderDetailEntity>(o => o.PurchaseOrderDetails)
                    .SubPath(detailPath => detailPath.Prefetch(pod => pod.Product)))
            .First();
```

With lambda expressions, you create the first node with _.Prefetch_, then on that node you can call _.SubPath_and start again with the new child as the root, and so on.

**Descend on the graph**

The same concept could be extended down more levels. See the next picture and code&#8230;

&#8230; and the corresponding code:

### Code

```csharp
IPrefetchPath2 myOrderPath = new PrefetchPath2((int)EntityType.PurchaseOrderEntity);
myOrderPath.Add(PurchaseOrderEntity.PrefetchPathPurchaseOrderDetails)
    .SubPath.Add(PurchaseOrderDetailEntity.PrefetchPathProduct)
        .SubPath.Add(ProductEntity.PrefetchPathModel);
```

As you can see, is the same technique, you just use it over and over many times as graph levels.

### Code (LINQ2LLBL – PathEdges)

```csharp
var q = (from o in metaData.PurchaseOrder
         where o.PurchaseOrderId == 4002
         select o)
            .WithPath (
                new PathEdge<PurchaseOrderDetailEntity>
                (
                    PurchaseOrderEntity.PrefetchPathPurchaseOrderDetails,
                        new PathEdge<ProductEntity>
                        (
                            PurchaseOrderDetailEntity.PrefetchPathProduct,
                                new PathEdge<ModelEntity>
                                (
                                    ProductEntity.PrefetchPathModel
                                )
                        )
                )
            )
            .First();
```

### Code (LINQ2LLBL – Lambda expressions)

```csharp
var q2 = (from o in metaData.PurchaseOrder
          where o.PurchaseOrderId == 4002
          select o)
            .WithPath(orderPath => orderPath
                .Prefetch<PurchaseOrderDetailEntity>(po => po.PurchaseOrderDetails)
                    .SubPath(detailPath => detailPath.Prefetch<ProductEntity>(pod => pod.Product)
                        .SubPath(prodPath => prodPath.Prefetch(p => p.Model))))
            .First();
```

---

## CASE C (n-depth, n-branch)

I call this case “n-depth, n-branch” because at some point you have one node that have more than one child (hope the name makes sense to you). So, consider the following graph representation:

You may say that we already do this on the root (Case A). We separate this case because you need to create explicitly a IPrefetchPathElement for that subpath node and add the childs to it. For LINQ2LLBL is almost the same as previous cases. See the code:

### Code

```csharp
// prepare orderDetail->product node (product -> model,  product -> reviews)
IPrefetchPathElement2 productNode = PurchaseOrderDetailEntity.PrefetchPathProduct;
productNode.SubPath.Add(ProductEntity.PrefetchPathModel);
productNode.SubPath.Add(ProductEntity.PrefetchPathReviews);

// prepare prefetch (order -> orderDetail -> product-node)
IPrefetchPath2 myOrderPath = new PrefetchPath2((int)EntityType.PurchaseOrderEntity);
myOrderPath.Add(PurchaseOrderEntity.PrefetchPathPurchaseOrderDetails)
    .SubPath.Add(productNode);

// fetch the graph
adapter.FetchEntity(myOrder, myOrderPath);
```

It’s a common mistake add the childs directly to the root element. Don’t do that, or you will receive an error  (See common mistakes).

### Code (LINQ2LLBL – PathEdges)

```csharp
LinqMetaData metaData = new LinqMetaData(adapter);
var q = (from o in metaData.PurchaseOrder
         where o.PurchaseOrderId == 4002
         select o)
            .WithPath(
                new PathEdge<PurchaseOrderDetailEntity>
                (
                    PurchaseOrderEntity.PrefetchPathPurchaseOrderDetails,
                        new PathEdge<ProductEntity>
                        (
                            PurchaseOrderDetailEntity.PrefetchPathProduct,

                                new PathEdge<ModelEntity>(
                                    ProductEntity.PrefetchPathModel),

                                new PathEdge<ReviewEntity>(
                                    ProductEntity.PrefetchPathReviews)
                        )
                )
            )
            .First();
```

### Code (LINQ2LLBL – Lambda expressions)

```csharp
var q2 = (from o in metaData.PurchaseOrder
          where o.PurchaseOrderId == 4002
          select o)
            .WithPath(
                orderPath => orderPath.Prefetch<PurchaseOrderDetailEntity>(
                o => o.PurchaseOrderDetails)
                    .SubPath(detailPath => detailPath.Prefetch<ProductEntity>(
                    od => od.Product)
                        .SubPath(productPath => productPath
                            .Prefetch(p => p.Model)
                            .Prefetch(p => p.Reviews)
                        )
                    )
            )
            .First();
```

---

## Combinations

Cool thing is that you can combine A, B and C as you want. Here is an example:

It’s pretty much the same if you divide the graph and identify the cases and then write the corresponding code.

### Code

```csharp
IPrefetchPathElement2 employeeNode = PurchaseOrderEntity.PrefetchPathEmployee;
employeeNode.SubPath.Add(EmployeeEntity.PrefetchPathContact);
employeeNode.SubPath.Add(EmployeeEntity.PrefetchPathManager)
    .SubPath.Add(EmployeeEntity.PrefetchPathContact);
employeeNode.SubPath.Add(EmployeeEntity.PrefetchPathEmployees)
    .SubPath.Add(EmployeeEntity.PrefetchPathContact);

// prepare prefetch (order -> employee-node)
IPrefetchPath2 myOrderPath = new PrefetchPath2((int)EntityType.PurchaseOrderEntity);
myOrderPath.Add(employeeNode);

// fetch the graph
adapter.FetchEntity(myOrder, myOrderPath);
```

### Code (LINQ2LLBL – PathEdges)

```csharp
LinqMetaData metaData = new LinqMetaData(adapter);
var q = (from o in metaData.PurchaseOrder
         where o.PurchaseOrderId == 4002
         select o)
            .WithPath(
                new PathEdge<EmployeeEntity>(PurchaseOrderEntity.PrefetchPathEmployee,
                    new PathEdge<ContactEntity>(EmployeeEntity.PrefetchPathContact),

                    new PathEdge<EmployeeEntity>(EmployeeEntity.PrefetchPathManager,
                        new PathEdge<ContactEntity>(EmployeeEntity.PrefetchPathContact)
                    ),

                    new PathEdge<EmployeeEntity>(EmployeeEntity.PrefetchPathEmployees,
                        new PathEdge<ContactEntity>(EmployeeEntity.PrefetchPathContact)
                    )
                )
            )
            .First();
```

### Code (LINQ2LLBL – Lambda expressions)

```csharp
// LINQ2LLBL (lambda expressions)
var q2 = (from o in metaData.PurchaseOrder
          where o.PurchaseOrderId == 4002
          select o)
            .WithPath(
                orderPath => orderPath.Prefetch<EmployeeEntity>(
                o => o.Employee)
                    .SubPath(employeePath => employeePath

                        .Prefetch<ContactEntity>(e => e.Contact)

                        .Prefetch<EmployeeEntity>(e => e.Manager)
                            .SubPath(managerPath => managerPath
                                .Prefetch(m => m.Contact))

                        .Prefetch<EmployeeEntity>(e => e.Employees)
                            .SubPath(empsPath => empsPath
                                .Prefetch(emps => emps.Contact))
                    )
            )
            .First();
```

And&#8230; here is another example, that combine the two example in Case C and the previous combined case.

### Code

```csharp
// prepare orderDetail->product node (product -> model,  product -> reviews)
IPrefetchPathElement2 productNode = PurchaseOrderDetailEntity.PrefetchPathProduct;
productNode.SubPath.Add(ProductEntity.PrefetchPathModel);
productNode.SubPath.Add(ProductEntity.PrefetchPathReviews);

// prepare order->employee-node (employee -> contact,  employee -> manager -> contact,
// employee -> employees -> contact)
IPrefetchPathElement2 employeeNode = PurchaseOrderEntity.PrefetchPathEmployee;
employeeNode.SubPath.Add(EmployeeEntity.PrefetchPathContact);
employeeNode.SubPath.Add(EmployeeEntity.PrefetchPathManager)
    .SubPath.Add(EmployeeEntity.PrefetchPathContact);
employeeNode.SubPath.Add(EmployeeEntity.PrefetchPathEmployees)
    .SubPath.Add(EmployeeEntity.PrefetchPathContact);

// prepare prefetch (order -> orderDetail -> product-node,  order -> employee-node)
IPrefetchPath2 myOrderPath = new PrefetchPath2((int)EntityType.PurchaseOrderEntity);
myOrderPath.Add(PurchaseOrderEntity.PrefetchPathPurchaseOrderDetails)
    .SubPath.Add(productNode);
myOrderPath.Add(employeeNode);

// fetch the graph
adapter.FetchEntity(myOrder, myOrderPath);
```

### Code (LINQ2LLBL – PathEdges)

```csharp
LinqMetaData metaData = new LinqMetaData(adapter);
var q = (from o in metaData.PurchaseOrder
         where o.PurchaseOrderId == 4002
         select o)
            .WithPath(
                new PathEdge<PurchaseOrderDetailEntity>
                (
                    PurchaseOrderEntity.PrefetchPathPurchaseOrderDetails,
                        new PathEdge<ProductEntity>
                        (
                            PurchaseOrderDetailEntity.PrefetchPathProduct,

                                new PathEdge<ModelEntity>(
                                    ProductEntity.PrefetchPathModel),

                                new PathEdge<ReviewEntity>(
                                    ProductEntity.PrefetchPathReviews)
                        )
                ),

                new PathEdge<EmployeeEntity>
                (
                    PurchaseOrderEntity.PrefetchPathEmployee,
                        new PathEdge<ContactEntity>(EmployeeEntity.PrefetchPathContact),

                        new PathEdge<EmployeeEntity>(EmployeeEntity.PrefetchPathManager,
                            new PathEdge<ContactEntity>(EmployeeEntity.PrefetchPathContact)
                        ),

                        new PathEdge<EmployeeEntity>(EmployeeEntity.PrefetchPathEmployees,
                            new PathEdge<ContactEntity>(EmployeeEntity.PrefetchPathContact)
                        )
                )
            )
            .First();
```

### Code (LINQ2LLBL – Lambda expressions)

```csharp
var q2 = (from o in metaData.PurchaseOrder
          where o.PurchaseOrderId == 4002
          select o)
            .WithPath( orderPath => orderPath
                .Prefetch<PurchaseOrderDetailEntity>(o => o.PurchaseOrderDetails)
                    .SubPath(detailPath => detailPath.Prefetch<ProductEntity>(
                        od => od.Product)
                            .SubPath(productPath => productPath
                                .Prefetch(p => p.Model)
                                .Prefetch(p => p.Reviews)
                            )
                    )

                .Prefetch<EmployeeEntity>(o => o.Employee)
                    .SubPath(employeePath => employeePath

                        .Prefetch<ContactEntity>(e => e.Contact)

                        .Prefetch<EmployeeEntity>(e => e.Manager)
                            .SubPath(managerPath => managerPath
                                .Prefetch(m => m.Contact))

                        .Prefetch<EmployeeEntity>(e => e.Employees)
                            .SubPath(empsPath => empsPath
                                .Prefetch(emps => emps.Contact))
                    )
            )
            .First();
```

---

## Filtering and Sorting

What if you want to apply filter/sort on a collection located on some node in the graph? Well, you can. Consider the following image that represent a graph in which we filter, sort and limit the number of results on the _PurchaseOrder_node. Plus we want to filter such node on a related entity that we will not fetch (_PurchaseOrderDetail_).

_PrefetchPath - Filtering. sorting and limiting_

Here is how you do that:

### Code

```csharp
// order collection to fetch
CustomerEntity myCustomer = new CustomerEntity(11091);

// prepare the filter for the orders
IPredicateExpression orderFilter = new PredicateExpression();
orderFilter.Add(new EntityField2("SalesOrderYear", new DbFunctionCall(
    "YEAR", new object[] { SalesOrderFields.OrderDate })) == 2003);
orderFilter.Add(SalesOrderDetailFields.ProductId != 923);

// prepare the relations (to be able to filter on salesOrderDetails fields)
IRelationCollection orderRelations = new RelationCollection();
orderRelations.Add(SalesOrderEntity.Relations.SalesOrderDetailEntityUsingSalesOrderId);

// prepare the sorter for the orders
ISortExpression orderSorter = new SortExpression(
    SalesOrderFields.TotalDue | SortOperator.Descending);

// prepare prefetch (customer -> salesOrder)
IPrefetchPath2 myCustomerPath = new PrefetchPath2((int)EntityType.CustomerEntity);
myCustomerPath.Add(CustomerEntity.PrefetchPathSalesOrders,
    5, orderFilter, orderRelations, orderSorter);

// fetch the graph
adapter.FetchEntity(myCustomer, myCustomerPath);
```

### Code (LINQ2LLBL – Lambda expressions)

```csharp
LinqMetaData metaData = new LinqMetaData(adapter);
var q = (from c in metaData.Customer
         where c.CustomerId == 11091
         select c)
            .WithPath(customerPath => customerPath
                .Prefetch<SalesOrderEntity>(c => c.SalesOrders)
                    .FilterOn(o => o.OrderDate.Year == 2003
                        && o.SalesOrderDetails.Where(od => od.ProductId != 923).Count() > 0)
                    .OrderByDescending(o => o.TotalDue)
                    .LimitTo(5)
            )
            .First();
```

> Note: In v2.6 you can’t filter prefetch paths on related entities because you can’t pass a relation collection. However you can do filter and sorting on the same entity that target the node. According to LLBLGen Pro forums this will be available in the next version. You, however, could achieve that with lambda expression.

---

## Common mistakes

Here I will address some examples on what to-do/no-to-do on some scenarios. These are more conceptual mistakes so I only give the LLBLGenPro API approach, it’s almost the same applying the concept to L_INQ2LLBL WithPath_.

### Incorrect root

Consider the following code:

```csharp
// order collection to fetch
CustomerEntity myCustomer = new CustomerEntity(11091);

// prepare prefetch (customer -> salesOrder)
IPrefetchPath2 myCustomerPath = new PrefetchPath2((int)EntityType.CustomerEntity);
myCustomerPath.Add(CustomerEntity.PrefetchPathSalesOrders);
myCustomerPath.Add(SalesOrderEntity.PrefetchPathSalesOrderDetails);
```

You did already see the glitch, didn’t you? Yes, here the programmer is adding a path element that **doesn’t correspond to the root element** (_line 7_). In this case s/he will get unexpected results. What s/he might want is add the second element as a subpath of the first one (see Case B).

### Using SubPath more than once on the same level

The trivia of the day: What is wrong with the next code?

```csharp
// order collection to fetch
CustomerEntity myCustomer = new CustomerEntity(11091);

// prepare prefetch (customer -> salesOrder)
IPrefetchPath2 myCustomerPath = new PrefetchPath2((int)EntityType.CustomerEntity);
myCustomerPath.Add(CustomerEntity.PrefetchPathSalesOrders)
    .SubPath.Add(SalesOrderEntity.PrefetchPathSalesOrderDetails)
    .SubPath.Add(SalesOrderEntity.PrefetchPathShipMethod);
```

Yes, you are right. The programmer is **using .SubPath twice on the same element**. In this case s/he will get a nice _ApplicationException_saying that some element doesn’t belong to the parent. How to correct this? See Case C.

### Filter on PrefetchPath expecting to filter on the root

Say you _want to get all addresses registered in “Ottawa”, and then obtain the sales orders shipped in such addresses_. One person (not you) might think that this piece should do the work:

```csharp
// order collection to fetch
EntityCollection<AddressEntity> addresses = new EntityCollection<AddressEntity>();

// just wanna the addresses from Ottawa
IPredicateExpression orderFilter = new PredicateExpression(
    AddressFields.City == "Ottawa");

IRelationCollection orderRelations = new RelationCollection();
orderRelations.Add(SalesOrderEntity.Relations.AddressEntityUsingShipToAddressId);

// for those addresses, give their orders
IPrefetchPath2 myAddressesPath = new PrefetchPath2((int)EntityType.AddressEntity);
myAddressesPath.Add(AddressEntity.PrefetchPathShippedSalesOrders, 0, orderFilter, orderRelations);

// fetch
adapter.FetchEntityCollection(addresses, null, myAddressesPath);
```

Now, the problem is that here _what is filtered are the SalesOrders_. This will result in _“all addresses (no matter the city) and for each Address its SalesOrders are fetched as well, but just the SalesOrders with ship address in Ottawa”_.
 To fix this, filter on the target root instead of the prefetch path:

```csharp
// order collection to fetch
EntityCollection<AddressEntity> addresses = new EntityCollection<AddressEntity>();

// just wanna the addresses from Ottawa
IRelationPredicateBucket filter = new RelationPredicateBucket(
    AddressFields.City == "Ottawa");

// for those addresses, give their orders
IPrefetchPath2 myAddressesPath = new PrefetchPath2((int)EntityType.AddressEntity);
myAddressesPath.Add(AddressEntity.PrefetchPathShippedSalesOrders);

// fetch
adapter.FetchEntityCollection(addresses, filter, myAddressesPath);
```

Now the world is well again. Note that this also applies on the contrary: if you filter on the root you can’t expect the prefeched objects are filtered as well. So as a rule of dumb: If you want the target root filtered then add the filter on the root fetch, If you want to filter on the related objects, then add the predicate expression to the prefetch path.

### Sorting on the root entity doesn’t sort the prefetched objects

Similar to above case is this. Say you _want all the addresses, and for each address you want its SalesOrders, then you want the SalesOrders of each Address to be ordered by TotalDue descending_. See the next attempt:

```csharp
// addresses to fetch
EntityCollection<AddressEntity> addresses = new EntityCollection<AddressEntity>();

// want the orders sorted by totalDue(cheapeast first)
SortExpression sorter = new SortExpression(
    SalesOrderFields.TotalDue | SortOperator.Descending);

// use relations to be able to sort
IRelationPredicateBucket bucket = new RelationPredicateBucket();
bucket.Relations.Add(AddressEntity.Relations.SalesOrderEntityUsingShipToAddressId);

// for those addresses, give their orders
IPrefetchPath2 myAddressPath = new PrefetchPath2((int)EntityType.AddressEntity);
myAddressPath.Add(AddressEntity.PrefetchPathShippedSalesOrders);

// fetch
adapter.FetchEntityCollection(addresses, bucket, 10, sorter, myAddressPath);
```

The problem now is that**the sorter (**_**SortExpression**_**) is applied on the primary fetch**. This wont result in what you want. What you should do is **add the sorter on the path element**:

```csharp
// addresses to fetch
EntityCollection<AddressEntity> addresses = new EntityCollection<AddressEntity>();

// want the orders sorted by totalDue(cheapeast first)
SortExpression sorter = new SortExpression(
    SalesOrderFields.TotalDue | SortOperator.Descending);

// for those addresses, give me their orders (sorted)
IPrefetchPath2 myAddressPath = new PrefetchPath2((int)EntityType.AddressEntity);
myAddressPath.Add(AddressEntity.PrefetchPathShippedSalesOrders, 0, null, null, sorter);

// fetch
adapter.FetchEntityCollection(addresses, null, 10, null, myAddressPath);
```

### Expect that some prefetch graph fetch fills automatically the m:n node

As you can add m:n relations on your LLBLGen Pro project, you also can prefetch them (f.i. prefetch _Product -> Documents_ instead of _Product -> ProductDocument -> Document_). After you discover this the world is better because that is more efficient and more easy to navigate _if you just want to reach the other side of the m:n relation_. But what happens if you also want to have the intermediate objects? Some people expects that adding the involved nodes on the m:n relation (m – m:n – n) would do the magic, well, no. Here is a typical attempt:

```csharp
// the product to fetch
ProductEntity myProduct = new ProductEntity(506);

// prepare the path (product -> productDocuemnt -> document)
IPrefetchPath2 myProductPath = new PrefetchPath2((int)EntityType.ProductEntity);
myProductPath.Add(ProductEntity.PrefetchPathProductDocuments)
    .SubPath.Add(ProductDocumentEntity.PrefetchPathDocument);

// fetch
adatper.FetchEntity(myProduct, myProductPath);

// tests
Assert.AreEqual(2, myProduct.ProductDocuments.Count);
Assert.AreEqual(2, myProduct.Documents.Count);
```

Note that we are prefetching the graph _product -> productDocuemnts -> document_. Some lines later (line 14) we expect that the m:n property (Documents) would be filled. That wont happen, it will return just 0. This is how it should work:

```csharp
// the product to fetch
ProductEntity myProduct = new ProductEntity(506);

// prepare the path (product -> productDocuemnt -> document,
// product -> document)
IPrefetchPath2 myProductPath = new PrefetchPath2((int)EntityType.ProductEntity);
myProductPath.Add(ProductEntity.PrefetchPathProductDocuments)
    .SubPath.Add(ProductDocumentEntity.PrefetchPathDocument);
myProductPath.Add(ProductEntity.PrefetchPathDocuments);

// fetch
adatper.FetchEntity(myProduct, myProductPath);
```

Now the tests work. Note that here we are fetching both branches: _product -> productDocuements -> document_ AND_product -> docuemnts_. This is the case when we want to navigate in both manners (through intermediate objects and directly on the _n_ side). This raise the question: After such fetch, ¿Are the entities on _product->documents_ the same as the _product->productDocuments->document_ ? In sort: no, but you can make them unique using Context ([read more about Context](http://www.llblgen.com/documentation/2.6/hh_goto.htm#Using%20the%20generated%20code/Adapter/gencode_usingcontext_adapter.htm)).

### The X -> Y -> X graph

This is the best name I found to this  In general you fetch a graph such _X -> Y -> Z_ (as in_Customer -> SalesOrder -> SalesOrderDetail_) but might be the case that you want something like _X -> Y -> X_ (as in_SalesOrder -> Customer -> SalesOrder_). Consider the following example:

```csharp
// order to fetch
SalesOrderEntity myOrder = new SalesOrderEntity(43659);

// prepare path (salesOrder -> customer -> salesOrder)
IPrefetchPath2 myOrderPath = new PrefetchPath2((int) EntityType.SalesOrderEntity);
myOrderPath.Add(SalesOrderEntity.PrefetchPathCustomer)
    .SubPath.Add(CustomerEntity.PrefetchPathSalesOrders);

// fetch
adaptter.FetchEntity(myOrder, myOrderPath);

// tests
Assert.IsNotNull(myOrder.Customer);
Assert.AreEqual(1, myOrder.Customer.SalesOrders.Where(so => so.SalesOrderId == 43659).Count());
```

That is, you have some salesOrder and want its customer and for that customer you want to see all its salesOrders. Now, at a first look this code seems ok. We expect that the customer only have one salesOrder with id 43659, well it wont, it will have 2.

The cause is that when synchronization is done at first node (_SalesOrder->Customer_) the framework do something like _myOrder.Customer = xxCustomer_ and then _xxCustomer.SalesOrders.Add(myOrder)_. Then as the synchronization takes place on the second node (_&#8230;Customer->SalesOrder_) the framework do something like _xxCustomer.SalesOrder.Add(theFetchedOrders)_ and _foreach fetchedOrderds theFetchedOrder.Customer = xxCustomer_. This will cause that the root order (43659) **would be added twice** into the _customer.SalesOrder_ collection. This is expected from a practical point of view, not in a semantical one though.

To overcome this, **you could add the graph into semantical context**, that way you ensure the objects are_semantically unique_. LLBLGen Pro support [Contexts](http://www.llblgen.com/documentation/2.6/hh_goto.htm#Using%20the%20generated%20code/Adapter/gencode_usingcontext_adapter.htm), this is how fix the above code:

```csharp
// order to fetch
SalesOrderEntity myOrder = new SalesOrderEntity(43659);

// prepare path (salesOrder -> customer -> salesOrder)
IPrefetchPath2 myOrderPath = new PrefetchPath2((int)EntityType.SalesOrderEntity);
myOrderPath.Add(SalesOrderEntity.PrefetchPathCustomer)
    .SubPath.Add(CustomerEntity.PrefetchPathSalesOrders);

// fetch
Context myContex = new Context();
adaptter.FetchEntity(myOrder, myOrderPath, myContex);

// tests
Assert.IsNotNull(myOrder.Customer);
Assert.AreEqual(1, myOrder.Customer.SalesOrders.Where(so => so.SalesOrderId == 43659).Count());
```

The only thing we did is create a Context and pass it to the fetch routine. Now we obtain the expected results

****

## Other Considerations

If you use PrefetchPaths ensure you are aware of:

- [Performance](http://www.llblgen.com/documentation/2.6/hh_goto.htm#Using%20the%20generated%20code/Adapter/gencode_prefetchpaths_adapter.htm)

- [Polymorphic PrefetchPaths](http://www.llblgen.com/documentation/2.6/hh_goto.htm#Using%20the%20generated%20code/Adapter/gencode_prefetchpaths_adapter.htm)

> As a side note, consider that PrefetchPaths might be the wrong choice depending upon your scenario. For example: if you want to fetch some graph just to display the plain result in a page or in a report (read-only) and you are looking for the fastest way of doing that, you should consider use TypedLists , TypedViews or DynamicLists .

> Other scenario is when you want to fetch a very very very large graph. For example when you want to migrate rows from Database1 to Databas2, or when you want to perform some action on a very large graph. This could consume very quickly your machine’s memory. Instead, consider processing the results in parts: partial fetches where the temp result is disposed and a new result take place.



Tags: [adapter](https://web.archive.org/web/2012/http://www.llblgening.com/archive/tag/adapter/), [linq2llbl](https://web.archive.org/web/2012/http://www.llblgening.com/archive/tag/linq2llbl/), [prefetchPaths](https://web.archive.org/web/2012/http://www.llblgening.com/archive/tag/prefetchpaths/)


				<p class="

> 9 of this post's 9 figures were not preserved by the Internet Archive and are missing here.

