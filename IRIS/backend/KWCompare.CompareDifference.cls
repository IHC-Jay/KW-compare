Class KWCompare.CompareDifference Extends %Persistent
{
Parameter SqlTableName = "KW_COMPARE_DIFFERENCE";

Property ID As %Integer [ Identity, Required ];
Property RunID As %Integer [ Required ];
Property ParentDifferenceID As %Integer;
Property DifferenceType As %String(MAXLEN=40) [ Required ];
Property RecordType As %String(MAXLEN=20);
Property FieldName As %String(MAXLEN=100);
Property OccurrenceNumber As %Integer;
Property FileALineNumber As %Integer;
Property FileBLineNumber As %Integer;
Property RecordKey As %String(MAXLEN=1000);
Property FileAValue As %String(MAXLEN=32000);
Property FileBValue As %String(MAXLEN=32000);
Property Details As %String(MAXLEN=4000);

Index RunDifferenceIdx On (RunID, DifferenceType);
Index RunFieldDifferenceIdx On (RunID, RecordType, FieldName);
}
