Class KWCompare.CompareConfig Extends %Persistent
{
Parameter SqlTableName = "KW_COMPARE_CONFIG";

Property ID As %Integer [ Identity, Required ];
Property ConfigName As %String(MAXLEN=200) [ Required ];
Property Description As %String(MAXLEN=1000);
Property Active As %Boolean [ InitialExpression = 1 ];
Property CreatedBy As %String(MAXLEN=100);
Property CreatedAt As %TimeStamp;
Property UpdatedAt As %TimeStamp;

Index ConfigNameIdx On ConfigName;
Index ActiveIdx On Active;
}
