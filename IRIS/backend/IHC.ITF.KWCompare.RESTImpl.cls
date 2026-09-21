Class IHC.ITF.KWCompare.RESTImpl
{

ClassMethod CompareFiles(request As %DynamicObject, ByRef response As %DynamicObject) As %Status
{
    Set fileAPath = request.%Get("fileAPath", "")
    Set fileBPath = request.%Get("fileBPath", "")
    Set configID = request.%Get("configID", 0)
    Set comparisonMode = request.%Get("comparisonMode", "LINE")

    Set runID = ##class(IHC.ITF.KWCompare.FileComparator).CompareFiles(fileAPath, fileBPath, configID, comparisonMode)
    Set run = ##class(IHC.ITF.KWCompare.CompareRun).%OpenId(runID)
    Set response = {}
    Do response.%Set("runID", runID)
    Do response.%Set("status", run.Status)
    Quit $$$OK
}

ClassMethod CompareDirectories(request As %DynamicObject, ByRef response As %DynamicObject) As %Status
{
    Set directoryA = request.%Get("directoryA", "")
    Set directoryB = request.%Get("directoryB", "")
    Set configID = request.%Get("configID", 0)
    Set comparisonMode = request.%Get("comparisonMode", "LINE")

    Set results = ##class(IHC.ITF.KWCompare.FileComparator).CompareDirectories(directoryA, directoryB, configID, comparisonMode)
    Set response = {}
    Do response.%Set("results", results)
    Do response.%Set("count", results.%Size())
    Quit $$$OK
}

ClassMethod ProcessX12(request As %DynamicObject, ByRef response As %DynamicObject) As %Status
{
    Set sourceDirectory = request.%Get("sourceDirectory", "")
    Set irisInboundDirectory = request.%Get("irisInboundDirectory", "")
    Set edifecsInboundDirectory = request.%Get("edifecsInboundDirectory", "")
    Set filePattern = request.%Get("filePattern", "*.x12")

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
    Set sourceFile = $ZSEARCH(sourceDirectory _ "/" _ filePattern)
    For  {
        If sourceFile = "" {
            Quit
        }
        If '##class(%File).DirectoryExists(sourceFile) {
            Set fileName = ..BaseName(sourceFile)
            Set irisTarget = irisInboundDirectory _ "/" _ fileName
            Set edifecsTarget = edifecsInboundDirectory _ "/" _ fileName
            Set status = ##class(%File).Copy(sourceFile, irisTarget)
            If $$$ISERR(status) {
                Throw ##class(%Exception.StatusException).CreateFromStatus(status)
            }
            Set status = ##class(%File).Copy(sourceFile, edifecsTarget)
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
        Set sourceFile = $ZSEARCH(sourceDirectory _ "/" _ filePattern)
    }

    Set response = {}
    Do response.%Set("count", routedFiles.%Size())
    Do response.%Set("filePattern", filePattern)
    Do response.%Set("files", routedFiles)
    Quit $$$OK
}

ClassMethod NormalizeDirectory(directory As %String) As %String
{
    If $Length(directory) > 1, $Extract(directory, $Length(directory)) = "/" {
        Quit $Extract(directory, 1, $Length(directory) - 1)
    }
    Quit directory
}

ClassMethod BaseName(path As %String) As %String
{
    Quit $Piece(path, "/", $Length(path, "/"))
}

ClassMethod GetRuns(ByRef response As %DynamicObject) As %Status
{
    Set runs = []
    Set statement = ##class(%SQL.Statement).%New()
    Set status = statement.%Prepare("SELECT TOP 100 ID, FileAName, FileBName, ComparisonMode, Status, StartedAt, CompletedAt, TotalDifferences, AddedRecords, RemovedRecords, ChangedFields FROM KW_COMPARE_RUN ORDER BY ID DESC")
    If $$$ISERR(status) {
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
    Set response = {}
    Do response.%Set("count", runs.%Size())
    Do response.%Set("runs", runs)
    Quit $$$OK
}

ClassMethod GetRun(id As %Integer, ByRef response As %DynamicObject) As %Status
{
    Set run = ##class(IHC.ITF.KWCompare.CompareRun).%OpenId(id)
    If '$IsObject(run) {
        Set response = {}
        Do response.%Set("error", "Comparison run was not found")
        Do response.%Set("runID", id)
        Quit $$$ERROR($$$GeneralError)
    }

    Set response = {}
    Do response.%Set("runID", run.ID)
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

ClassMethod GetDifferences(id As %Integer, ByRef response As %DynamicObject) As %Status
{
    Set run = ##class(IHC.ITF.KWCompare.CompareRun).%OpenId(id)
    If '$IsObject(run) {
        Set response = {}
        Do response.%Set("error", "Comparison run was not found")
        Do response.%Set("runID", id)
        Quit $$$ERROR($$$GeneralError)
    }

    Set ignoredFields = {}
    Set status = ..LoadIgnoredFields(run.ConfigID, .ignoredFields)
    If $$$ISERR(status) {
        Quit status
    }
    Set differences = []
    Set statement = ##class(%SQL.Statement).%New()
    Set status = statement.%Prepare("SELECT ID, DifferenceType, RecordType, FieldName, OccurrenceNumber, FileALineNumber, FileBLineNumber, RecordKey, FileAValue, FileBValue, Details FROM KW_COMPARE_DIFFERENCE WHERE RunID = ? AND ParentDifferenceID IS NULL ORDER BY ID")
    If $$$ISERR(status) {
        Quit status
    }
    Set fieldStatement = ##class(%SQL.Statement).%New()
    Set status = fieldStatement.%Prepare("SELECT ID, DifferenceType, RecordType, FieldName, OccurrenceNumber, FileALineNumber, FileBLineNumber, RecordKey, FileAValue, FileBValue, Details FROM KW_COMPARE_DIFFERENCE WHERE RunID = ? AND ParentDifferenceID = ? ORDER BY ID")
    If $$$ISERR(status) {
        Quit status
    }
    Set result = statement.%Execute(id)
    While result.%Next() {
        Set difference = {}
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
            If ignoredFields.%IsDefined(fieldName) {
                Continue
            }
            Set field = {}
            Do field.%Set("id", fieldResult.%Get("ID"))
            Do field.%Set("differenceType", fieldResult.%Get("DifferenceType"))
            Do field.%Set("recordType", fieldResult.%Get("RecordType"))
            Do field.%Set("fieldName", fieldName)
            Do field.%Set("occurrenceNumber", fieldResult.%Get("OccurrenceNumber"))
            Do field.%Set("fileALineNumber", fieldResult.%Get("FileALineNumber"))
            Do field.%Set("fileBLineNumber", fieldResult.%Get("FileBLineNumber"))
            Do field.%Set("fileAValue", fieldResult.%Get("FileAValue"))
            Do field.%Set("fileBValue", fieldResult.%Get("FileBValue"))
            Do field.%Set("details", fieldResult.%Get("Details"))
            Do fields.%Push(field)
        }
        Do difference.%Set("fields", fields)
        Do differences.%Push(difference)
    }
    Set response = {}
    Do response.%Set("runID", id)
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
    Set status = statement.%Prepare("SELECT FieldName FROM KW_COMPARE_CONFIG_FIELD WHERE ConfigID = ? AND IgnoreField = 1")
    If $$$ISERR(status) {
        Quit status
    }
    Set result = statement.%Execute(configID)
    While result.%Next() {
        Do ignoredFields.%Set(result.%Get("FieldName"), 1)
    }
    Quit $$$OK
}

}
