Class KWCompare.CompareRunField Extends %Persistent
{
Parameter SqlTableName = "KW_COMPARE_RUN_FIELD";

Property ID As %Integer [ Identity, Required ];
Property RunID As %Integer [ Required ];
Property RecordType As %String(MAXLEN=20) [ Required ];
Property FieldName As %String(MAXLEN=100) [ Required ];
Property FileACount As %Integer [ InitialExpression = 0 ];
Property FileBCount As %Integer [ InitialExpression = 0 ];
Property DifferentCount As %Integer [ InitialExpression = 0 ];
Property DateLikeField As %Boolean [ InitialExpression = 0 ];
Property Ignored As %Boolean [ InitialExpression = 0 ];

Index RunFieldIdx On (RunID, RecordType, FieldName) [ Unique ];
}
