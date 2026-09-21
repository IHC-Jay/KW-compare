Class KWCompare.CompareRun Extends %Persistent
{
Parameter SqlTableName = "KW_COMPARE_RUN";

Property ID As %Integer [ Identity, Required ];
Property ConfigID As %Integer;
Property ConfigNameSnapshot As %String(MAXLEN=200);
Property FileAName As %String(MAXLEN=500) [ Required ];
Property FileAPath As %String(MAXLEN=2000);
Property FileAHash As %String(MAXLEN=128);
Property FileASize As %Integer;
Property FileBName As %String(MAXLEN=500) [ Required ];
Property FileBPath As %String(MAXLEN=2000);
Property FileBHash As %String(MAXLEN=128);
Property FileBSize As %Integer;
Property ComparisonMode As %String(MAXLEN=50);
Property Status As %String(MAXLEN=30) [ InitialExpression = "STARTED" ];
Property StartedAt As %TimeStamp;
Property CompletedAt As %TimeStamp;
Property TotalDifferences As %Integer [ InitialExpression = 0 ];
Property AddedRecords As %Integer [ InitialExpression = 0 ];
Property RemovedRecords As %Integer [ InitialExpression = 0 ];
Property ChangedFields As %Integer [ InitialExpression = 0 ];
Property OrderDifferences As %Integer [ InitialExpression = 0 ];
Property ErrorMessage As %String(MAXLEN=4000);

Index StatusIdx On Status;
Index StartedAtIdx On StartedAt;
Index ConfigRunIdx On (ConfigID, StartedAt);
}
