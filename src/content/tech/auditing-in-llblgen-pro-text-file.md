---
title: "Auditing in LLBLGen Pro (Text File)"
summary: "In this article:."
date: 2009-08-29
tags:
  - "articles"
source: "http://www.llblgening.com/archive/2009/08/auditing-in-llblgen-pro-text-file/"
sourceArchive: "https://web.archive.org/web/20090915173527/http://www.llblgening.com/archive/2009/08/auditing-in-llblgen-pro-text-file/"
---
## This is part of the Auditing in LLBLGen Pro serie of articles. These articles will use the LLBLGen Pro Auditing Example as explanation. You can download the source code at LLBLGen Pro Site – Examples section (Auditing example) . In this article I will focus on Adapter/ASP.Net project/C# project. Doing it in SelfServiing should be almost the same.

**In this article:**

- Some things to know about the example

- The SimpleeTextFileAuditor

- Adding a new product

- Editing a product

- Deleting a product

- Updating multiple products

- Persist audit information

- References

**Keep reading the related articles**

- [Auditing in LLBLGen Pro (Introduction)](/tech/auditing-in-llblgen-pro-introduction/)

- Auditing in LLBLGen Pro (Database) -> comming soon

- Auditing in LLBLGen Pro (Database entity specific) -> comming soon

---

## Some things to know about the example

**SimpleTextFileAuditor**class is intended to demonstrate how to successfully audit entity information to a text file using LLBLGenPro v2.6 Auditor and Dependency Injection. This class was placed in a separate project, so when we would deploy, it would generates a separate DLL (SimpleTextFileAuditor.dll).

This Auditor is injected to **ProductEntity**instances. The injection information is set at the class signature **via DependencyInjection** attributes. This Auditor use `DependencyInjectionContextType.Singleton` context type as is the best choice for single-file auditing schema in multi-user/multi-threading scenario.

To tell the GUI that there’re objects to inject somewhere, there are some properties we set at web.config:

```xml
<dependencyInjectionInformation>
 <additionalAssemblies>
 <assembly  filename="SimpleTextFileAuditor.dll"/>
 </additionalAssemblies>
</dependencyInjectionInformation>
```

To understand Dependency Injection and the ways you can use it, pelase [read the docs.](http://www.llblgen.com/documentation/2.6/hh_goto.htm#Using%20the%20generated%20code/gencode_usingdi.htm).

The audited actions are loged into a text-file, by default this file is located at `c:\noraudit.txt`. If want to change this, you can do that within web.config:

```xml
<!-- Used by SimpleTextAuditor class to write  entities tracking info.
If this key is missing, a default filename will be  used ("c:\\noraudit.txt") -->
<add key="SimpleTextAuditorTxtFileName"  value="C:\\noraudit.txt"/>
```

## The SimpleTextFileAuditor class

As I said, this class demostrates how to audit to a text file. But, What makes our class an Auditor? The next little snippet:

```csharp
[DependencyInjectionInfo(typeof(ProductEntity),  "AuditorToUse",
    ContextType =  DependencyInjectionContextType.Singleton)] [Serializable]
public class  SimpleTextFileAuditor : AuditorBase
{
    //...
}
```

What we are saying here is: I want my class be an LLBLGenPro Auditor, and this Auditor will be injected to ProductEntity instances, on the property AuditorToUse. Such derivation makes possible to access some methods we can override to add functionallity to our audito (we will look into this briefly).

### Private custom members

These are some custom members written as helpers on our auditor:

**AuditType**. Is a custom enum that help us to identify and send to the file the corresponding action audited.

```csharp
private enum AuditType
{
    DeleteOfEntity=1,
    DirectDeleteOfEntities,
    DirectUpdateOfEntities,
    DereferenceOfRelatedEntity,
    ReferenceOfRelatedEntity,
    EntityFieldGet,
    EntityFieldSet,
    InsertOfNewEntity,
    UpdateOfExistingEntity,
    LoadOfExistingEntity
}
```

**The constructor**. As you can see, here we initialize the StringWriter that will help us to persist the audit action to the text file. Also the destination file name is read from the config file, if there is any problem, the default path and name are used (”c:\noraudit.txt”).

```csharp
public SimpleTextFileAuditor()
{
    // clear temporal audit stream
    _auditInfoSW = new StringWriter();

    // look for SimpleTextAuditorTxtFileName setting at .config file
    AppSettingsReader appConfiguration = new AppSettingsReader();
    try
    {
        _outputAuditFileName = (string) appConfiguration.GetValue("SimpleTextAuditorTxtFileName", typeof(string));
    }

    // SimpleTextAuditorTxtFileName not found! use default filename
    catch (InvalidOperationException)
    {
        _outputAuditFileName = "c:\\noraudit.txt";
    }
}
```

**GetCurrentUserID**. It Loads the current user Id from the session. Each audit action recorded into the text carries the user who made it.

```csharp
private string GetCurrentUserID()
        {
            return SessionHelper.GetUserID();
        }
```

**GetPrimaryKeyInfoFromEntity**. From a given entity, GetPrimaryKeyInfoFromEntity will return a string representation of the field names and values of the primary key. This is useful when we will audit some entity, we want to know what entity was added/edited/deleted.

```csharp
private string GetPrimaryKeyInfoFromEntity(IEntityCore entity)
{
    // used to collect PK fields info
    string strPKEntityInfo = string.Empty;

    // gets primary key fields
    List<IEntityField2> pkFields = ((IEntity2)entity).PrimaryKeyFields;

    // collect PK fields if the entity isn't new
    if (!entity.IsNew)
    {
        // construct formatted string with pk fields
        strPKEntityInfo = "PK(";
        foreach (IEntityField2 pkField in pkFields)
        {
            strPKEntityInfo += string.Format("{0}:{1}, ", pkField.Name, pkField.CurrentValue.ToString());
        }

        // delete the extra ", " and ends with ")"
        strPKEntityInfo = strPKEntityInfo.Remove(strPKEntityInfo.Length - 2, 2);
        strPKEntityInfo += ")";
    }

    // returns PK info
    return strPKEntityInfo;
}
```

**ConstructAuditRecord**. It receives some entity name, an audit action and the relevant action information (such PK, values, etc.). In addition to the given information, it will add the datetime and the current user.

```csharp
private StringWriter ConstructAuditRecord(string affectedEntityName, AuditType actionType, string actionData)
{
    StringWriter tmpAuditOfLoadEntitySW = new StringWriter();
    tmpAuditOfLoadEntitySW.WriteLine("{0} ---------------------------------------------------", DateTime.Now);
    tmpAuditOfLoadEntitySW.WriteLine("USER:   {0}", GetCurrentUserID());
    tmpAuditOfLoadEntitySW.WriteLine("ENTITY: {0}", affectedEntityName);
    tmpAuditOfLoadEntitySW.WriteLine("ACTION: {0}", actionType);
    tmpAuditOfLoadEntitySW.WriteLine("DATA:   {0}", actionData);
    tmpAuditOfLoadEntitySW.WriteLine();

    return tmpAuditOfLoadEntitySW;
}
```

**AddAuditRecordStringToBulkStream**. It simply add some audit record to a stream.

```csharp
private void AddAuditRecordStringToBulkStream(string auditRecordString)
{
    // add for later persist
    _auditInfoSW.WriteLine(auditRecordString);
}
```

**PersistAuditInfoThreadSafe**. This method will take some string writer and will write down the info into a text file.

```csharp
private void PersistAuditInfoThreadSafe(StringWriter sw)
{
    /// Disclaimer: This procedure doesn't intend to show the best approach to use text-based
    /// auditing concurrency as there are many ways to achieve such a thing. Choose the best
    /// approach that fits your project's architecture and requirements.

    // avoid multiple threads open the file at the same time
    lock (this)
    {
        // creates a thread-safe (synchronized) wrapper around the specified Stream object
        TextWriter auditStream = new StreamWriter(_outputAuditFileName, true);
        TextWriter auditStreamThreadSafe = StreamWriter.Synchronized(auditStream);

        // write audit info
        auditStreamThreadSafe.Write(sw.GetStringBuilder().ToString());

        // close and clean stuff
        auditStreamThreadSafe.Close();
        auditStream.Close();

        sw.Flush();
    }
}
```

---

## Intercept changes made on entity fields

In this auditor, auditing the action of adding or editing an entity is made in three stages:

- Intercept and grab changes made on entity fields.

- Intercept the save of an entity (either new or existing)

- Persist changes to text file.

For other operations that the user perform in one shot, as delete an entity or update multiple entities, the audit info is written right away.

So, whenever you set/change some value on a entity field, **AuditEntyFieldSet** is called . Within this method you have access to the involved entity, the index of the field and the original value. Basically we will collect the entity info and put it on a string record. Remember that at this stage the info is not written to the file, in case the user cancel the action.

Below, the code for the AuditEntityFieldSet which I think is self-explained.

```csharp
/// <summary>
/// Audits when an entity field is set succesfully to a new value.
/// </summary>
/// <param name="entity">The entity a field was set to a new value.</param>
/// <param name="fieldIndex">Index of the field which got a new value.</param>
/// <param name="originalValue">The original value of the field with the index passed in
/// before it received a new value.</param>
public override void AuditEntityFieldSet(IEntityCore entity, int fieldIndex, object originalValue)
{
    // avoid to audit into AuditInfoEntity (this would create an overflow effect). This is necessary if this auditor is injected into
    // all entities, thus also in the AuditInfoEntity
    if(entity is AuditInfoEntity)
    {
        return;
    }

    // used to store the change experimented by a field.
    string originalValueAsString = string.Empty;
    string currentValue = string.Empty;

    // sets VALUE OR NULL for originalValue and uses it as string.
    if (originalValue != null)
    {
        originalValueAsString = originalValue.ToString();
    }
    else
    {
        originalValueAsString = "NULL";
    }

    // sets VALUE OR NULL for currentValue and uses it as string.
    if (entity.GetCurrentFieldValue(fieldIndex) != null)
    {
        currentValue = entity.GetCurrentFieldValue(fieldIndex).ToString();
    }
    else
    {
        currentValue = "NULL";
    }

    // construct audit info record
    StringWriter auditInfo = ConstructAuditRecord(entity.LLBLGenProEntityName,
        AuditType.EntityFieldSet,
        string.Format("{0}. FieldSet: {1}. OriginalValue: {2}. CurrentValue: {3}",
            GetPrimaryKeyInfoFromEntity(entity),
            ((IEntity2)entity).Fields[fieldIndex].Name,
            originalValueAsString, currentValue));

    // add to later-persist list
    AddAuditRecordStringToBulkStream(auditInfo.GetStringBuilder().ToString());
}
```

Pretty simple: We collect the original value and current value of the field, and then construct a string record with this info. Other custom method provides us the PK. As you can see we never check whether the original and current value are different, this is because this method only fires when you really change the value.

We will see how this method works when you save the entity (existing or new).

---

## Adding a product

As we explained in the previous subject, auditthe addition of a new entity is performed in three steps. The first is interceptiing the change of the field values. In the case of a new entity all original values should be NULL.

Now we will see the second step, saving the new entity. The next image shows how you would make it at GUI.

Behind the scenes this form uses LLBLGenProDataSource2. For more info, see the code.

Now, back to our auditor, you have to implement the **AuditInsertOfNewEntity**method. Below is the code for that. It’s pretty simply, it constructs a new string record with the entity name, the audit action (insert) and the primary key information of the entity. Remember that this method is called just after the entity was being saved to the database. Then the string record is passed to a stream that we will persist later.

```csharp
/// <summary>
/// Audits the successful insert of a new entity into the database.
/// </summary>
/// <param name="entity">The entity saved successfully into the database.</param>
public override void AuditInsertOfNewEntity(IEntityCore entity)
{
    // avoid to audit into AuditInfoEntity (this would create an overflow effect). This is necessary if this auditor is injected into
    // all entities, thus also in the AuditInfoEntity
    if(entity is AuditInfoEntity)
    {
        return;
    }

    // construct audit info record
    StringWriter auditInfo = ConstructAuditRecord(entity.LLBLGenProEntityName,
        AuditType.InsertOfNewEntity,
        GetPrimaryKeyInfoFromEntity(entity));

    // add to later-persist list
    AddAuditRecordStringToBulkStream(auditInfo.GetStringBuilder().ToString());
}
```

Pretty simple eh! Now see how it will look at text file when the info be written:

_Add a new product (log)_

---

## Editing a product

Editing is pretty the same of Adding. The next image shows how you would edit a product on GUI. Here we sill simply edit one field (UnitPrice).

The difference -obviously- is that in Editing the entity is not new. As AuditInsertOfNewEntity, **AuditUpdateOfExistingEntity**works with the involved entity only. We just grab the info of the edited entity, remember that the information of the field changes were stored before.

```csharp
/// <summary>
/// Audits the successful update of an existing entity in the database
/// </summary>
/// <param name="entity">The entity updated successfully in the database.</param>
public override void AuditUpdateOfExistingEntity(IEntityCore entity)
{
    // avoid to audit into AuditInfoEntity (this would create an overflow effect). This is necessary if this auditor is injected into
    // all entities, thus also in the AuditInfoEntity
    if(entity is AuditInfoEntity)
    {
        return;
    }

    // construct audit info record
    StringWriter auditInfo = ConstructAuditRecord(entity.LLBLGenProEntityName,
        AuditType.UpdateOfExistingEntity,
        GetPrimaryKeyInfoFromEntity(entity));

    // add to later-persist list
    AddAuditRecordStringToBulkStream(auditInfo.GetStringBuilder().ToString());
}
```

After this happened, and the changes were commited, this is how the text file would look like:

---

## Deleting a product

Now the user wants to delete some product. See how s/he would do that in GUI:

There is almost no code behind the scenes as it is managed by LLBLGenProDataSource2. To audit the deletion of an entity you override the **AuditDeleteOfEntity**on our auditor which receives the involved entity. Then you just need to create a string record with the information of the entity and pass it to the stream.

```csharp
/// <summary>
/// Audits the successful delete of an entity from the database
/// </summary>
/// <param name="entity">The entity which was deleted.</param>
/// <remarks>As the entity passed in was deleted succesfully, reading values from the
/// passed in entity is only possible in this routine. After this call, the
/// state of the entity will be reset to Deleted again and reading the fields
/// will result in an exception. It's also recommended not to reference
/// the passed in entity in any audit entity you might want to persist as the entity doesn't
/// exist anymore in the database.</remarks>
public override void AuditDeleteOfEntity(IEntityCore entity)
{
    // avoid to audit into AuditInfoEntity (this would create an overflow effect). This is necessary if this auditor is injected into
    // all entities, thus also in the AuditInfoEntity
    if(entity is AuditInfoEntity)
    {
        return;
    }

    // construct audit info record
    StringWriter auditInfo = ConstructAuditRecord(entity.LLBLGenProEntityName,
        AuditType.DeleteOfEntity, GetPrimaryKeyInfoFromEntity(entity));

    // add to later-persist list
    AddAuditRecordStringToBulkStream(auditInfo.GetStringBuilder().ToString());
}
```

And how it will look like in the text file? Here it is:

---

## Updating multiple products

Below is the image of the button you can push to perform a direct update to products.

Behind the scenes, the button performs the following code:

```csharp
protected void btnDirectUpdate_Click(object sender, EventArgs e)
{
    /// Set Discontinued=True ALL products of category 'Sea Food' (8)

    // category = seaFood
    IRelationPredicateBucket filter = new RelationPredicateBucket();
    filter.PredicateExpression.Add(ProductFields.CategoryId == 8);

    // set discontinued
    ProductEntity productUpdatedValues = new ProductEntity();
    productUpdatedValues.Discontinued = true;

    // perform update
    using (DataAccessAdapter  adapter = new DataAccessAdapter())
    {
        adapter.UpdateEntitiesDirectly(productUpdatedValues, filter);
    }
}
```

Whenever something like that is issued, LLBLGen call the **AuditDirectUpdateOfEntities**auditor method that allow us to log that action. What we want to log here? Basically, the filter of the update, the value of the parameters of the filter, and the field and new values that were updated.

```csharp
/// <summary>
/// Audits the succesful direct update of entities in the database.
/// </summary>
/// <param name="entity">The entity with the changed values which is used to produce the update
/// query.</param>
/// <param name="filter">The filter to filter out the entities to update.</param>
/// <param name="relations">The relations to use with the filter. Can be null.</param>
/// <param name="numberOfEntitiesUpdated">The number of entities updated.</param>
public override void AuditDirectUpdateOfEntities(IEntityCore entity, IPredicate filter,
    IRelationCollection relations, int numberOfEntitiesUpdated)
{
    // avoid to audit into AuditInfoEntity (this would create an overflow effect). This is necessary if this auditor is injected into
    // all entities, thus also in the AuditInfoEntity
    if(entity is AuditInfoEntity)
    {
        return;
    }

    // get filter's queryText
    int tmpParameterCount = 0;
    string strFilter = filter.ToQueryText(ref tmpParameterCount);

    // construct parameters info
    string strParameters = string.Empty;
    foreach (IDataParameter param in filter.Parameters)
    {
        strParameters += (param.ParameterName + "=" + param.Value.ToString() + ". ");
    }

    // construct update-new-values info of the direct update
    string updatedFields = string.Empty;
    foreach (IEntityField2 field in ((IEntity2)entity).Fields)
    {
        if (field.IsChanged)
        {
            updatedFields += (field.Name + "=" + field.CurrentValue.ToString() + ". ");
        }
    }

    // construct audit info record
    StringWriter auditInfo = ConstructAuditRecord(entity.LLBLGenProEntityName,
        AuditType.DirectUpdateOfEntities,
        string.Format("updatedFields: {0}  updateFilter: {1}.  filterParameters: {2}", updatedFields, strFilter, strParameters));

// save the record info
    PersistAuditInfoThreadSafe(auditInfo);
}
```

I think the code snippet is pretty self-explained. LLBLGenPro framework provide us the necesary tools to access those information in a very easy way. Similar to this is the _AuditDirectDeleteOfEntities_method, that do pretty the same but the action is _DirectDeleteOfEntities_.

After we log the audit action. This is how it is reflected on the text file:

---

## Persist the audit information

Remember we talk about three steps on audit the action of Adding/Editing an entity? The last one is persist the info to the text file. Until now, every string record were added to a string writer. It’s time to write them down to the text file. To do this, we use the **TransactionCommitted()** method. This method is normally used to clean things when we are auditing to the database, however we are gonna use it to write to the text file. This is because that method is called when the transaction -where the entities belongs to- is committed.

```csharp
public override void TransactionCommitted()
{
// persist textFile-based audit information
PersistAuditInfoThreadSafe(_auditInfoSW);
}
```

---

## References

- [Setting up and using Dependency Injection (LLBLGen Pro Manual)](http://www.llblgen.com/documentation/2.6/hh_goto.htm#Using%20the%20generated%20code/gencode_auditing.htm)

- [Setting up and using Auditing (LLBLGen Pro Manaul)](http://www.llblgen.com/documentation/2.6/hh_goto.htm#Using%20the%20generated%20code/gencode_usingdi.htm)

**Keep reading the related articles**

- [Auditing in LLBLGen Pro (Introduction)](/tech/auditing-in-llblgen-pro-introduction/)

- Auditing in LLBLGen Pro (Database)

- Auditing in LLBLGen Pro (Database entity specific)

You can download the source code at [LLBLGen Pro Site – Examples section (Auditing example)](http://llblgen.com/pages/examples.aspx).



Tags: [adapter](https://web.archive.org/web/2012/http://www.llblgening.com/archive/tag/adapter/), [auditing](https://web.archive.org/web/2012/http://www.llblgening.com/archive/tag/auditing/), [DI](https://web.archive.org/web/2012/http://www.llblgening.com/archive/tag/dependency-injection/)


				<p class="

> 8 of this post's 8 figures were not preserved by the Internet Archive and are missing here.

