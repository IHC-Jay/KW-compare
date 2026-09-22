Class IHC.ITF.KWCompare.RESTImpl
{

ClassMethod CompareFiles(request As %DynamicObject, ByRef response As %DynamicObject) As %Status
{
	set ^webService("KWCompare CompareFiles Start") = $ZDATETIME($HOROLOG, 3, 1, 6)
    Set fileAPath = request.%Get("fileAPath", "")
    Set fileBPath = request.%Get("fileBPath", "")
    Set configID = request.%Get("configID", 0)
    Set deleteExistingResults = +request.%Get("deleteExistingResults", 0)
    Set comparisonMode = request.%Get("comparisonMode", "LINE")

    If deleteExistingResults=1 {
        Set status = ..DeleteExistingResults()
        If $$$ISERR(status) {
            Quit status
        }
    }

    Set runID = ##class(IHC.ITF.KWCompare.FileComparator).CompareFiles(fileAPath, fileBPath, configID, comparisonMode)
    Set run = ##class(IHC.ITF.KWCompare.CompareRun).%OpenId(runID)
    Set response = {}.%Set("runID",runID, "status",run.Status)
    set ^webService("KWCompare CompareFiles Complete") = $ZDATETIME($HOROLOG, 3, 1, 6)

    Quit $$$OK
}

ClassMethod CompareDirectories(request As %DynamicObject, ByRef response As %DynamicObject) As %Status
{
	set ^webService("KWCompare CompareDirectories Start") = $ZDATETIME($HOROLOG, 3, 1, 6)
    Set directoryA = request.%Get("directoryA", "")
    Set directoryB = request.%Get("directoryB", "")
    Set configID = request.%Get("configID", 0)
    Set deleteExistingResults = +request.%Get("deleteExistingResults", 0)
    Set comparisonMode = request.%Get("comparisonMode", "LINE")

    If deleteExistingResults=1 {
        Set status = ..DeleteExistingResults()
        If $$$ISERR(status) {
            Quit status
        }
    }

    Set results = ##class(IHC.ITF.KWCompare.FileComparator).CompareDirectories(directoryA, directoryB, configID, comparisonMode)

    Set response = {}.%Set("results",results, "count",results.%Size())
    set ^webService("KWCompare CompareDirectories Complete ") = results.%Size() _ " files @ " _ $ZDATETIME($HOROLOG, 3, 1, 6)
    Quit $$$OK
}

ClassMethod DeleteExistingResults() As %Status
{
    set ^webService("KWCompare DeleteExistingResults") = "Start @ " _ $ZDATETIME($HOROLOG, 3, 1, 6)
    TSTART

    Set status = ..ExecuteDelete("DELETE FROM IHC_ITF_KWCompare.CompareDifference")
    If $$$ISERR(status) {
        TROLLBACK
        Quit status
    }

    Set status = ..ExecuteDelete("DELETE FROM IHC_ITF_KWCompare.CompareOrderDifference")
    If $$$ISERR(status) {
        TROLLBACK
        Quit status
    }

    Set status = ..ExecuteDelete("DELETE FROM IHC_ITF_KWCompare.CompareRunField")
    If $$$ISERR(status) {
        TROLLBACK
        Quit status
    }

    Set status = ..ExecuteDelete("DELETE FROM IHC_ITF_KWCompare.CompareRun")
    If $$$ISERR(status) {
        TROLLBACK
        Quit status
    }

    TCOMMIT
    set ^webService("KWCompare DeleteExistingResults") = "Completed @ " _ $ZDATETIME($HOROLOG, 3, 1, 6)
    Quit $$$OK
}

ClassMethod ExecuteDelete(sql As %String) As %Status
{
    Set statement = ##class(%SQL.Statement).%New()
    Set status = statement.%Prepare(sql)
    If $$$ISERR(status) {
        set ^webService("KWCompare DeleteExistingResults Error") = "Prepare failed: " _ sql
        Quit status
    }
    Set result = statement.%Execute()
    If result.%SQLCODE '= 0 {
        set ^webService("KWCompare DeleteExistingResults Error") = "Execute failed: " _ sql _ " SQLCODE=" _ result.%SQLCODE
        Quit $$$ERROR($$$GeneralError)
    }
    Quit $$$OK
}

ClassMethod GetRuns(ByRef response As %DynamicObject) As %Status
{
    Set runs = []
    Set response = {}
    
    set ^webService("KWCompare GetRuns") = "Start: " _ $ZDATETIME($HOROLOG, 3, 1, 6)
    Set statement = ##class(%SQL.Statement).%New()
    Set status = statement.%Prepare("SELECT * FROM IHC_ITF_KWCompare.CompareRun ORDER BY ID DESC")
    If $$$ISERR(status) {
	    set ^webService("KWCompare Error") = status
	    Do response.%Set("count","0")
        Quit status
    }
    Set result = statement.%Execute()
    While result.%Next() {
        Set run = {}
        Do run.%Set("runID", result.%Get("ID"))
        Do run.%Set("fileName", result.%Get("FileAName"))
        Do run.%Set("fileAName", result.%Get("FileAName"))
        Do run.%Set("fileBName", result.%Get("FileBName"))
        Do run.%Set("comparisonMode", result.%Get("ComparisonMode"))
        Do run.%Set("status", result.%Get("Status"))
        Do run.%Set("startedAt", result.%Get("StartedAt"))
        Do run.%Set("completedAt", result.%Get("CompletedAt"))
        Do run.%Set("totalDifferences", result.%Get("TotalDifferences"))
        Do run.%Set("addedRecords", result.%Get("AddedRecords"))
        Do run.%Set("removedRecords", result.%Get("RemovedRecords"))
        Do run.%Set("changedFields", result.%Get("ChangedFields"))
        Do runs.%Push(run)
    }
    
    Do response.%Set("count", runs.%Size())
    Do response.%Set("runs", runs)
    set ^webService("KWCompare GetRuns Size") = runs.%Size()
    Quit $$$OK
}

ClassMethod GetRun(id As %Integer, ByRef response As %DynamicObject) As %Status
{
	set ^webService("KWCompare GetRun") = "Start: " _ $ZDATETIME($HOROLOG, 3, 1, 6)
    Set run = ##class(IHC.ITF.KWCompare.CompareRun).%OpenId(id)
    If '$IsObject(run) {
        Set response = {}
        Do response.%Set("error", "Comparison run was not found")
        Do response.%Set("runID", id)
        Quit $$$ERROR($$$GeneralError)
    }

    Set response = {}
    Do response.%Set("runID", run.Id)
    Do response.%Set("configID", run.ConfigID)
    Do response.%Set("configName", run.ConfigNameSnapshot)
    Do response.%Set("fileAName", run.FileAName)
    Do response.%Set("fileBName", run.FileBName)
    Do response.%Set("comparisonMode", run.ComparisonMode)
    Do response.%Set("status", run.Status)
    Do response.%Set("startedAt", run.StartedAt)
    Do response.%Set("completedAt", run.CompletedAt)
    Do response.%Set("totalDifferences", run.TotalDifferences)
    Do response.%Set("addedRecords", run.AddedRecords)
    Do response.%Set("removedRecords", run.RemovedRecords)
    Do response.%Set("changedFields", run.ChangedFields)
    Do response.%Set("orderDifferences", run.OrderDifferences)
    Do response.%Set("errorMessage", run.ErrorMessage)
    Quit $$$OK
}

ClassMethod GetDifferences(id As %Integer, ByRef response As %DynamicObject, configID As %Integer = 0) As %Status
{
	set ^webService("KWCompare GetDifferences") = "Start: Id: " _ id _ " @ " _ $ZDATETIME($HOROLOG, 3, 1, 6)
    Set run = ##class(IHC.ITF.KWCompare.CompareRun).%OpenId(id)
    If '$IsObject(run) {
        Set response = {}
        Do response.%Set("error", "Comparison run was not found")
        Do response.%Set("runID", id)
        Quit $$$ERROR($$$GeneralError)
    }
    set totalDifferences = run.TotalDifferences
    
    Set selectedConfigID = +$Get(configID)
    If selectedConfigID<0 {
        Set selectedConfigID = 0
    }

    Set ignoredFields = {}
    Set status = ..LoadIgnoredFields(selectedConfigID, .ignoredFields)
    If $$$ISERR(status) {
        Quit status
    }
    Set ignoredConfigFields = []
    Set status = ..LoadIgnoredFieldDetails(selectedConfigID, .ignoredConfigFields)
    If $$$ISERR(status) {
        Quit status
    }

    Set differences = []
    Set ignoredFieldDetails = []
    Kill ignoredSeen
    Set statement = ##class(%SQL.Statement).%New()
    
    Set status = statement.%Prepare("SELECT ID, DifferenceType, RecordType, FieldName, OccurrenceNumber, FileALineNumber, FileBLineNumber, RecordKey, FileAValue, FileBValue, Details FROM IHC_ITF_KWCompare.CompareDifference WHERE RunID = ? AND ParentDifferenceID IS NULL ORDER BY ID")
    If $$$ISERR(status) {
	    set ^webService("KWCompare Prepare") = status
        Quit status
    }
    Set fieldStatement = ##class(%SQL.Statement).%New()
    Set status = fieldStatement.%Prepare("SELECT ID, DifferenceType, RecordType, FieldName, OccurrenceNumber, FileALineNumber, FileBLineNumber, RecordKey, FileAValue, FileBValue, Details FROM IHC_ITF_KWCompare.CompareDifference WHERE RunID = ? AND ParentDifferenceID = ? ORDER BY ID")
    If $$$ISERR(status) {
	    set ^webService("KWCompare Prepare") = status
        Quit status
    }
    Set result = statement.%Execute(id)
    While result.%Next() {
        Set difference = {}
        set ^webService("KWCompare get next") = result.%Get("FieldName")
        Do difference.%Set("id", result.%Get("ID"))
        Do difference.%Set("differenceType", result.%Get("DifferenceType"))
        Do difference.%Set("recordType", result.%Get("RecordType"))
        Do difference.%Set("fieldName", result.%Get("FieldName"))
        Do difference.%Set("occurrenceNumber", result.%Get("OccurrenceNumber"))
        Do difference.%Set("fileALineNumber", result.%Get("FileALineNumber"))
        Do difference.%Set("fileBLineNumber", result.%Get("FileBLineNumber"))
        Do difference.%Set("recordKey", result.%Get("RecordKey"))
        Do difference.%Set("fileAValue", result.%Get("FileAValue"))
        Do difference.%Set("fileBValue", result.%Get("FileBValue"))
        Do difference.%Set("details", result.%Get("Details"))
        Set fields = []
        Set fieldResult = fieldStatement.%Execute(id, result.%Get("ID"))
        While fieldResult.%Next() {
            Set fieldName = fieldResult.%Get("FieldName")
            Set fieldRecordType = $ZSTRIP(fieldResult.%Get("RecordType"), "<>W")
            Set ignoredKey = $ZCONVERT(fieldRecordType, "U") _ "|" _ $ZCONVERT(fieldName, "U")
            If ignoredFields.%IsDefined(ignoredKey) || ignoredFields.%IsDefined($ZCONVERT(fieldName, "U")) {
                If '$Data(ignoredSeen(ignoredKey)) {
                    Set ignoredSeen(ignoredKey) = 1
                    Set ignoredField = {}
                    Do ignoredField.%Set("recordType", fieldRecordType)
                    Do ignoredField.%Set("fieldName", fieldName)
                    Do ignoredFieldDetails.%Push(ignoredField)
                }
                Continue
            }
            Set field = {}
            set ^webService("KWCompare get next field") = fieldName
            Do field.%Set("id", fieldResult.%Get("ID"))
            Do field.%Set("differenceType", fieldResult.%Get("DifferenceType"))
            Do field.%Set("recordType", fieldRecordType)
            Do field.%Set("fieldName", fieldName)
            Do field.%Set("occurrenceNumber", fieldResult.%Get("OccurrenceNumber"))
            Do field.%Set("fileALineNumber", fieldResult.%Get("FileALineNumber"))
            Do field.%Set("fileBLineNumber", fieldResult.%Get("FileBLineNumber"))
            Do field.%Set("fileAValue", fieldResult.%Get("FileAValue"))
            Do field.%Set("fileBValue", fieldResult.%Get("FileBValue"))
            Do field.%Set("details", fieldResult.%Get("Details"))
            Do fields.%Push(field)
        }
        If result.%Get("DifferenceType") = "CHANGED", fields.%Size() = 0 {
            Continue
        }
        Do difference.%Set("fields", fields)
        Do differences.%Push(difference)
    }
    set ignoredByConfig = $Select((totalDifferences-differences.%Size())>0:run.TotalDifferences-differences.%Size(),1:0)
    Set response = {}
    Do response.%Set("runID", id)
    Do response.%Set("configID", selectedConfigID)
    Do response.%Set("totalDifferences", totalDifferences)
    Do response.%Set("visibleDifferences", differences.%Size())
    Do response.%Set("ignoredByConfig", ignoredByConfig)
    Do response.%Set("ignoredFieldDetails", ignoredFieldDetails)
    Do response.%Set("ignoredConfigFields", ignoredConfigFields)
    Do response.%Set("count", differences.%Size())
    Do response.%Set("differences", differences)
    Quit $$$OK
}

ClassMethod LoadIgnoredFields(configID As %Integer, ByRef ignoredFields As %DynamicObject) As %Status
{
    If configID = 0 {
        Quit $$$OK
    }
    Set statement = ##class(%SQL.Statement).%New()
    Set status = statement.%Prepare("SELECT RecordType, FieldName FROM IHC_ITF_KWCompare.CompareConfigField WHERE ConfigID = ? AND IgnoreField = 1")
    If $$$ISERR(status) {
        Quit status
    }
    Set result = statement.%Execute(configID)
    While result.%Next() {
        Set recordType = $ZSTRIP(result.%Get("RecordType"), "<>W")
        Set fieldName = $ZSTRIP(result.%Get("FieldName"), "<>W")
        If fieldName = "" {
            Continue
        }
        Set key = $ZCONVERT(recordType, "U") _ "|" _ $ZCONVERT(fieldName, "U")
        Do ignoredFields.%Set(key, 1)
        If recordType = "" {
            Do ignoredFields.%Set($ZCONVERT(fieldName, "U"), 1)
        }
    }
    Quit $$$OK
}

ClassMethod LoadIgnoredFieldDetails(configID As %Integer, ByRef ignoredConfigFields As %DynamicArray) As %Status
{
    Set ignoredConfigFields = []
    If configID = 0 {
        Quit $$$OK
    }
    Set statement = ##class(%SQL.Statement).%New()
    Set status = statement.%Prepare("SELECT RecordType, FieldName FROM IHC_ITF_KWCompare.CompareConfigField WHERE ConfigID = ? AND IgnoreField = 1 ORDER BY RecordType, FieldName")
    If $$$ISERR(status) {
        Quit status
    }
    Set result = statement.%Execute(configID)
    While result.%Next() {
        Set field = {}
        Do field.%Set("recordType", $ZSTRIP(result.%Get("RecordType"), "<>W"))
        Do field.%Set("fieldName", $ZSTRIP(result.%Get("FieldName"), "<>W"))
        Do ignoredConfigFields.%Push(field)
    }
    Quit $$$OK
}

ClassMethod ProcessX12(request As %DynamicObject, ByRef response As %DynamicObject) As %Status
{
	set ^webService("ProcessX12") = "Start" _ " @ " _ $ZDATETIME($HOROLOG, 3, 1, 6)
    Set sourceDirectory = request.%Get("sourceDirectory", "")
    Set irisInboundDirectory = request.%Get("irisInboundDirectory", "")
    Set edifecsInboundDirectory = request.%Get("edifecsInboundDirectory", "")
    Set filePattern = request.%Get("filePattern", "*.x12")
	set ^webService("ProcessX12") = "Params: "  _ sourceDirectory _", " _ irisInboundDirectory _", " _ edifecsInboundDirectory_", " _ filePattern
    
    If sourceDirectory = "" || irisInboundDirectory = "" || edifecsInboundDirectory = "" {
        Throw ##class(%Exception.General).%New("sourceDirectory, irisInboundDirectory, and edifecsInboundDirectory are required")
    }
    If filePattern = "" {
        Set filePattern = "*.x12"
    }
    If '##class(%File).DirectoryExists(sourceDirectory) {
        Throw ##class(%Exception.General).%New("Source directory was not found: " _ sourceDirectory)
    }
    If '##class(%File).DirectoryExists(irisInboundDirectory) {
        Throw ##class(%Exception.General).%New("IRIS inbound directory was not found: " _ irisInboundDirectory)
    }
    If '##class(%File).DirectoryExists(edifecsInboundDirectory) {
        Throw ##class(%Exception.General).%New("Edifecs inbound directory was not found: " _ edifecsInboundDirectory)
    }

    Set sourceDirectory = ..NormalizeDirectory(sourceDirectory)
    Set irisInboundDirectory = ..NormalizeDirectory(irisInboundDirectory)
    Set edifecsInboundDirectory = ..NormalizeDirectory(edifecsInboundDirectory)
    Set routedFiles = []
    
    Set tSC = ##class(%File).FileSetExecute(.tHandle, sourceDirectory, filePattern, "", 1, ",")
    set ^webService("ProcessX12") = "FileSetExecute: " _ tSC
		If $$$ISOK(tSC) {
			
			Set tAtEnd = 0
			For {
				Set tSC = ##class(%File).FileSetFetch(.tHandle, .tRow, .tAtEnd)
				set ^webService("ProcessX12") = "file from directory " _ tSC _", End: " _ tAtEnd _", entry: " _ tRow
				If '$$$ISOK(tSC)!($ListLength(tRow)<6) Quit
				set sourceFile = $List(tRow, 1)
				set attr = ##class(%File).Attributes(sourceFile)
			
				if ( $BIT($FACTOR(attr),16) = 1) // Regular file
				{
				
		            Set fileName = ##class(%File).GetFilename(sourceFile)
		            set ^webService("ProcessX12 Process") =  fileName
		            
		            Set irisTarget = irisInboundDirectory _ "/" _ fileName
		            Set edifecsTarget = edifecsInboundDirectory _ "/" _ fileName
		            Set status = ##class(%File).CopyFile(sourceFile, irisTarget)
		            If $$$ISERR(status) {
		                Throw ##class(%Exception.StatusException).CreateFromStatus(status)
		            }
		            Set status = ##class(%File).CopyFile(sourceFile, edifecsTarget)
		            If $$$ISERR(status) {
		                Throw ##class(%Exception.StatusException).CreateFromStatus(status)
		            }
		            Set routedFile = {}
		            Do routedFile.%Set("fileName", fileName)
		            Do routedFile.%Set("sourcePath", sourceFile)
		            Do routedFile.%Set("irisTarget", irisTarget)
		            Do routedFile.%Set("edifecsTarget", edifecsTarget)
		            Do routedFiles.%Push(routedFile)
				}
        }
        
    }

    Set response = {}
    Do response.%Set("count", routedFiles.%Size())
    Do response.%Set("filePattern", filePattern)
    Do response.%Set("files", routedFiles)
    set ^webService("ProcessX12") = "End" _ " @ " _ $ZDATETIME($HOROLOG, 3, 1, 6)
    
    Quit $$$OK
}

ClassMethod NormalizeDirectory(directory As %String) As %String
{
    If $Length(directory) > 1, $Extract(directory, $Length(directory)) = "/" {
        Quit $Extract(directory, 1, $Length(directory) - 1)
    }
    Quit directory
}

ClassMethod GetConfigs(ByRef response As %DynamicObject) As %Status
{
    Set configs = []
    Set statement = ##class(%SQL.Statement).%New()
    Set status = statement.%Prepare("SELECT TOP 200 ID, ConfigName, Description, Active, CreatedBy, CreatedAt, UpdatedAt FROM IHC_ITF_KWCompare.CompareConfig ORDER BY ID DESC")
    If $$$ISERR(status) {
        Quit status
    }
    Set result = statement.%Execute()
    While result.%Next() {
        Set config = {}
        Set configID = result.%Get("ID")
        Do config.%Set("id", configID)
        Do config.%Set("configName", result.%Get("ConfigName"))
        Do config.%Set("description", result.%Get("Description"))
        Do config.%Set("active", result.%Get("Active"))
        Do config.%Set("createdBy", result.%Get("CreatedBy"))
        Do config.%Set("createdAt", result.%Get("CreatedAt"))
        Do config.%Set("updatedAt", result.%Get("UpdatedAt"))
        Do configs.%Push(config)
    }
    Set response = {}
    Do response.%Set("count", configs.%Size())
    Do response.%Set("configs", configs)
    Quit $$$OK
}

ClassMethod GetConfig(id As %Integer, ByRef response As %DynamicObject) As %Status
{
    Set statement = ##class(%SQL.Statement).%New()
    Set status = statement.%Prepare("SELECT ID, ConfigName, Description, Active, CreatedBy, CreatedAt, UpdatedAt FROM IHC_ITF_KWCompare.CompareConfig WHERE ID = ?")
    If $$$ISERR(status) {
        Quit status
    }

    Set result = statement.%Execute(id)
    If 'result.%Next() {
        Set response = {}
        Do response.%Set("error", "Config was not found")
        Do response.%Set("configID", id)
        Quit $$$ERROR($$$GeneralError)
    }

    Set fields = []
    Set fieldStatement = ##class(%SQL.Statement).%New()
    Set status = fieldStatement.%Prepare("SELECT ID, RecordType, FieldName, IgnoreField, IgnoreReason, CreatedAt, UpdatedAt FROM IHC_ITF_KWCompare.CompareConfigField WHERE ConfigID = ? ORDER BY RecordType, FieldName")
    If $$$ISERR(status) {
        Quit status
    }
    Set fieldResult = fieldStatement.%Execute(id)
    While fieldResult.%Next() {
        Set field = {}
        Do field.%Set("id", fieldResult.%Get("ID"))
        Do field.%Set("recordType", fieldResult.%Get("RecordType"))
        Do field.%Set("fieldName", fieldResult.%Get("FieldName"))
        Do field.%Set("ignoreField", fieldResult.%Get("IgnoreField"))
        Do field.%Set("ignoreReason", fieldResult.%Get("IgnoreReason"))
        Do field.%Set("createdAt", fieldResult.%Get("CreatedAt"))
        Do field.%Set("updatedAt", fieldResult.%Get("UpdatedAt"))
        Do fields.%Push(field)
    }

    Set response = {}
    Do response.%Set("id", result.%Get("ID"))
    Do response.%Set("configName", result.%Get("ConfigName"))
    Do response.%Set("description", result.%Get("Description"))
    Do response.%Set("active", result.%Get("Active"))
    Do response.%Set("createdBy", result.%Get("CreatedBy"))
    Do response.%Set("createdAt", result.%Get("CreatedAt"))
    Do response.%Set("updatedAt", result.%Get("UpdatedAt"))
    Do response.%Set("fieldCount", fields.%Size())
    Do response.%Set("fields", fields)
    Quit $$$OK
}

ClassMethod CreateConfig(request As %DynamicObject, ByRef response As %DynamicObject) As %Status
{
    Set configName = $ZSTRIP(request.%Get("configName", ""), "<>W")
    Set description = request.%Get("description", "")
    Set active = +request.%Get("active", 1)
    Set createdBy = request.%Get("createdBy", "ui")

    If configName = "" {
        Throw ##class(%Exception.General).%New("configName is required")
    }

    Set now = $ZDATETIME($HOROLOG, 3, 1, 6)
    Set insertStatement = ##class(%SQL.Statement).%New()
    Set status = insertStatement.%Prepare("INSERT INTO IHC_ITF_KWCompare.CompareConfig (ConfigName, Description, Active, CreatedBy, CreatedAt, UpdatedAt) VALUES (?, ?, ?, ?, ?, ?)")
    If $$$ISERR(status) {
        Quit status
    }
    Set insertResult = insertStatement.%Execute(configName, description, active, createdBy, now, now)
    If insertResult.%SQLCODE '= 0 {
        Quit $$$ERROR($$$GeneralError)
    }

    Set idStatement = ##class(%SQL.Statement).%New()
    Set status = idStatement.%Prepare("SELECT TOP 1 ID FROM IHC_ITF_KWCompare.CompareConfig WHERE ConfigName = ? ORDER BY ID DESC")
    If $$$ISERR(status) {
        Quit status
    }
    Set idResult = idStatement.%Execute(configName)
    If 'idResult.%Next() {
        Quit $$$ERROR($$$GeneralError)
    }
    Set configID = idResult.%Get("ID")

    Set savedCount = 0
    Set status = ..ReplaceConfigFields(configID, request, .savedCount)
    If $$$ISERR(status) {
        Quit status
    }

    Set response = {}
    Do response.%Set("id", configID)
    Do response.%Set("configName", configName)
    Do response.%Set("fieldCount", savedCount)
    Quit $$$OK
}

ClassMethod UpdateConfig(id As %Integer, request As %DynamicObject, ByRef response As %DynamicObject) As %Status
{
    Set exists = ..ConfigExists(id)
    If 'exists {
        Set response = {}
        Do response.%Set("error", "Config was not found")
        Do response.%Set("configID", id)
        Quit $$$ERROR($$$GeneralError)
    }

    Set configName = $ZSTRIP(request.%Get("configName", ""), "<>W")
    Set description = request.%Get("description", "")
    Set active = +request.%Get("active", 1)
    If configName = "" {
        Throw ##class(%Exception.General).%New("configName is required")
    }

    Set now = $ZDATETIME($HOROLOG, 3, 1, 6)
    Set updateStatement = ##class(%SQL.Statement).%New()
    Set status = updateStatement.%Prepare("UPDATE IHC_ITF_KWCompare.CompareConfig SET ConfigName = ?, Description = ?, Active = ?, UpdatedAt = ? WHERE ID = ?")
    If $$$ISERR(status) {
        Quit status
    }
    Set updateResult = updateStatement.%Execute(configName, description, active, now, id)
    If updateResult.%SQLCODE '= 0 {
        Quit $$$ERROR($$$GeneralError)
    }

    Set savedCount = 0
    Set status = ..ReplaceConfigFields(id, request, .savedCount)
    If $$$ISERR(status) {
        Quit status
    }

    Set response = {}
    Do response.%Set("id", id)
    Do response.%Set("configName", configName)
    Do response.%Set("fieldCount", savedCount)
    Quit $$$OK
}

ClassMethod SaveConfigFields(id As %Integer, request As %DynamicObject, ByRef response As %DynamicObject) As %Status
{
    Set exists = ..ConfigExists(id)
    If 'exists {
        Set response = {}
        Do response.%Set("error", "Config was not found")
        Do response.%Set("configID", id)
        Quit $$$ERROR($$$GeneralError)
    }

    Set savedCount = 0
    Set status = ..ReplaceConfigFields(id, request, .savedCount)
    If $$$ISERR(status) {
        Quit status
    }

    Set response = {}
    Do response.%Set("id", id)
    Do response.%Set("fieldCount", savedCount)
    Quit $$$OK
}

ClassMethod ConfigExists(id As %Integer) As %Boolean
{
    Set statement = ##class(%SQL.Statement).%New()
    Set status = statement.%Prepare("SELECT ID FROM IHC_ITF_KWCompare.CompareConfig WHERE ID = ?")
    If $$$ISERR(status) {
        Quit 0
    }
    Set result = statement.%Execute(id)
    Quit result.%Next()
}

ClassMethod ReplaceConfigFields(configID As %Integer, request As %DynamicObject, ByRef savedCount As %Integer) As %Status
{
    Set savedCount = 0
    set ^webService("ReplaceConfigFields Start") =  configID
    Set fields = request.%Get("fields", "")
    If '$IsObject(fields) {
        Set fields = request.%Get("rules", "")
    }

    Set deleteStatement = ##class(%SQL.Statement).%New()
    Set status = deleteStatement.%Prepare("DELETE FROM IHC_ITF_KWCompare.CompareConfigField WHERE ConfigID = ?")
    If $$$ISERR(status) {
        Quit status
    }
    Set deleteResult = deleteStatement.%Execute(configID)
    If deleteResult.%SQLCODE '= 0 {
        // Quit $$$ERROR($$$GeneralError)
        set ^webService("ReplaceConfigFields Delete") =  configID _" not found"
    }

    If '$IsObject(fields) {
        Quit $$$OK
    }
    set ^webService("ReplaceConfigFields Insert") =  configID

    Set now = $ZDATETIME($HOROLOG, 3, 1, 6)
    Set insertStatement = ##class(%SQL.Statement).%New()
    Set status = insertStatement.%Prepare("INSERT INTO IHC_ITF_KWCompare.CompareConfigField (ConfigID, RecordType, FieldName, IgnoreField, IgnoreReason, CreatedAt, UpdatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)")
    If $$$ISERR(status) {
        Quit status
    }

    Kill seen
    For index = 0:1:fields.%Size()-1 {
        Set row = fields.%Get(index)
        If '$IsObject(row) {
            Continue
        }

        Set recordType = $ZSTRIP(row.%Get("recordType", ""), "<>W")
        Set fieldName = $ZSTRIP(row.%Get("fieldName", ""), "<>W")
        Set ignoreField = +row.%Get("ignoreField", 1)
        Set ignoreReason = row.%Get("ignoreReason", "")

        If recordType = "" || fieldName = "" {
            Continue
        }

        Set key = $ZCONVERT(recordType, "U") _ "|" _ $ZCONVERT(fieldName, "U")
        If $Data(seen(key)) {
            Continue
        }
        Set seen(key) = 1

        Set insertResult = insertStatement.%Execute(configID, recordType, fieldName, ignoreField, ignoreReason, now, now)
        If insertResult.%SQLCODE '= 0 {
            Quit $$$ERROR($$$GeneralError)
        }
        Set savedCount = savedCount + 1
    }
    set ^webService("ReplaceConfigFields End") =  "Saved " _ savedCount _ " for ID: " _configID

    Quit $$$OK
}

}
