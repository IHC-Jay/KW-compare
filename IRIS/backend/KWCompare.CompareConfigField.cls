Class KWCompare.CompareConfigField Extends %Persistent
{
Parameter SqlTableName = "KW_COMPARE_CONFIG_FIELD";

Property ID As %Integer [ Identity, Required ];
Property ConfigID As %Integer [ Required ];
Property RecordType As %String(MAXLEN=20) [ Required ];
Property FieldName As %String(MAXLEN=100) [ Required ];
Property IgnoreField As %Boolean [ InitialExpression = 0 ];
Property IgnoreReason As %String(MAXLEN=500);
Property CreatedAt As %TimeStamp;
Property UpdatedAt As %TimeStamp;

Index ConfigFieldIdx On (ConfigID, RecordType, FieldName) [ Unique ];
}
