Class KWCompare.CompareOrderDifference Extends %Persistent
{
Parameter SqlTableName = "KW_COMPARE_ORDER_DIFFERENCE";

Property ID As %Integer [ Identity, Required ];
Property RunID As %Integer [ Required ];
Property RecordType As %String(MAXLEN=20);
Property RecordKey As %String(MAXLEN=1000);
Property FileAOrder As %Integer;
Property FileBOrder As %Integer;
Property Details As %String(MAXLEN=4000);

Index RunOrderIdx On RunID;
Index RunRecordOrderIdx On (RunID, RecordType, RecordKey);
}
