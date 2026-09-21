#include %occStatus

Class KWCompare.FileComparator
{

/// Compares two text files line by line and returns the KW_COMPARE_RUN ID.
ClassMethod CompareFiles(fileAPath As %String, fileBPath As %String, configID As %Integer = 0, comparisonMode As %String = "LINE") As %Integer
{
	WRITE !, "CompareFiles: " _ fileAPath _", " _ fileBPath
    If fileAPath = "" || fileBPath = "" {
        Throw ##class(%Exception.General).%New("Both file paths are required")
    }

    Set run = ##class(IHC.ITF.KWCompare.CompareRun).%New()
    Set run.ConfigID = configID
    Set run.FileAName = ..BaseName(fileAPath)
    Set run.FileAPath = fileAPath
    Set run.FileBName = ..BaseName(fileBPath)
    Set run.FileBPath = fileBPath
    Set run.ComparisonMode = comparisonMode
    Set run.Status = "STARTED"
    Set run.StartedAt = $ZDATETIME($HOROLOG, 3, 1, 6)

    If configID'="" {
        Set config = ##class(IHC.ITF.KWCompare.CompareConfig).%OpenId(configID)
        If '$IsObject(config) {
	        WRITE !, "Comparison configuration was not found: " _ configID
            Throw ##class(%Exception.General).%New("Comparison configuration was not found")
        }
        WRITE !, "IHC.ITF.KWCompare.CompareConfig: " _ config.ConfigName
        Set run.ConfigNameSnapshot = config.ConfigName
    }

    Set status = run.%Save()
    WRITE !, "IHC.ITF.KWCompare.CompareRun Save: " _ status
    If $$$ISERR(status) {
        Throw ##class(%Exception.StatusException).CreateFromStatus(status)
    }

    Try {
        Set streamA = ##class(%Stream.FileCharacter).%New()
        Set status = streamA.LinkToFile(fileAPath)
        If $$$ISERR(status) {
            Throw ##class(%Exception.StatusException).CreateFromStatus(status)
        }

        Set streamB = ##class(%Stream.FileCharacter).%New()
        Set status = streamB.LinkToFile(fileBPath)
        If $$$ISERR(status) {
            Throw ##class(%Exception.StatusException).CreateFromStatus(status)
        }

        Set lineA = 0
        Set lineB = 0
        For  {
            Set endA = streamA.AtEnd
            Set endB = streamB.AtEnd
            if ( (endA) && (endB) )
            {
	            QUIT
            }

            Set valueA = ""
            Set valueB = ""
            If 'endA {
                Set valueA = streamA.ReadLine()
                Set lineA = lineA + 1
            }
            If 'endB {
                Set valueB = streamB.ReadLine()
                Set lineB = lineB + 1
            }

            If endA {
                Set status = ..SaveDifference(run.ID, "ADDED", lineA, lineB, valueA, valueB, .lineDifferenceID)
                If $$$ISERR(status) {
                    Throw ##class(%Exception.StatusException).CreateFromStatus(status)
                }
                Set run.AddedRecords = run.AddedRecords + 1
            } ElseIf endB {
                Set status = ..SaveDifference(run.ID, "REMOVED", lineA, lineB, valueA, valueB, .lineDifferenceID)
                If $$$ISERR(status) {
                    Throw ##class(%Exception.StatusException).CreateFromStatus(status)
                }
                Set run.RemovedRecords = run.RemovedRecords + 1
            } ElseIf valueA '= valueB {
                Set status = ..SaveDifference(run.ID, "CHANGED", lineA, lineB, valueA, valueB, .lineDifferenceID)
                If $$$ISERR(status) {
                    Throw ##class(%Exception.StatusException).CreateFromStatus(status)
                }
                Set status = ..SaveFieldDifferences(run.ID, lineDifferenceID, lineA, lineB, valueA, valueB)
                If $$$ISERR(status) {
                    Throw ##class(%Exception.StatusException).CreateFromStatus(status)
                }
                Set run.ChangedFields = run.ChangedFields + 1
            }
        }

        Set run.TotalDifferences = run.AddedRecords + run.RemovedRecords + run.ChangedFields
        Set run.Status = "COMPLETED"
        Set run.CompletedAt = $ZDATETIME($HOROLOG, 3, 1, 6)
        Set status = run.%Save()
        If $$$ISERR(status) {
            Throw ##class(%Exception.StatusException).CreateFromStatus(status)
        }
    } Catch exception {
        Set run.Status = "FAILED"
        Set run.CompletedAt = $ZDATETIME($HOROLOG, 3, 1, 6)
        Set run.ErrorMessage = exception.DisplayString()
        Set status = run.%Save()
        If $$$ISERR(status) {
            Throw ##class(%Exception.StatusException).CreateFromStatus(status)
        }
        Throw exception
    }

    Quit run.%Id()
}

/// Compares files with matching names from two directories.
ClassMethod CompareDirectories(directoryA As %String, directoryB As %String, configID As %Integer = 0, comparisonMode As %String = "LINE") As %DynamicArray
{
    If directoryA = "" || directoryB = "" {
        Throw ##class(%Exception.General).%New("Both directory paths are required")
    }
    If '##class(%File).DirectoryExists(directoryA) {
        Throw ##class(%Exception.General).%New("Directory A was not found: " _ directoryA)
    }
    If '##class(%File).DirectoryExists(directoryB) {
        Throw ##class(%Exception.General).%New("Directory B was not found: " _ directoryB)
    }

    Set directoryA = ..NormalizeDirectory(directoryA)
    Set directoryB = ..NormalizeDirectory(directoryB)
    Set results = []
    Set fileA = $ZSEARCH(directoryA _ "*")
    For  {
        Quit:fileA = ""
        If '##class(%File).DirectoryExists(fileA) {
            Set fileName = ..BaseName(fileA)
            Set fileMap(fileName) = fileA
        }
        Set fileA = $ZSEARCH(directoryA _ "*")
    }

    Set fileB = $ZSEARCH(directoryB _ "*")
    For  {
        Quit:fileB = ""
        If '##class(%File).DirectoryExists(fileB) {
            Set fileName = ..BaseName(fileB)
            If $Data(fileMap(fileName)) {
                Set runID = ..CompareFiles(fileMap(fileName), fileB, configID, comparisonMode)
                Do results.%Push({"fileName":fileName, "runID":runID})
            }
        }
        Set fileB = $ZSEARCH(directoryB _ "*")
    }

    Quit results
}

ClassMethod NormalizeDirectory(directory As %String) As %String
{
    Set lastCharacter = $Extract(directory, $Length(directory))
    If $Length(directory) > 1, (lastCharacter = "/" || lastCharacter = "\\") {
        Quit $Extract(directory, 1, $Length(directory) - 1)
    }
    Quit directory
}

ClassMethod SaveDifference(runID As %Integer, differenceType As %String, lineA As %Integer, lineB As %Integer, valueA As %String, valueB As %String, ByRef differenceID As %Integer) As %Status
{
    Set difference = ##class(IHC.ITF.KWCompare.CompareDifference).%New()
    Set difference.RunID = runID
    Set difference.DifferenceType = differenceType
    Set difference.RecordType = "LINE"
    Set difference.FieldName = "LINE"
    Set difference.OccurrenceNumber = $SELECT(lineA>lineB:lineA, 1:lineB)
    Set difference.FileALineNumber = lineA
    Set difference.FileBLineNumber = lineB
    Set difference.RecordKey = $SELECT(lineA>lineB:lineA, 1:lineB)
    Set difference.FileAValue = $EXTRACT(valueA, 1, 32000)
    Set difference.FileBValue = $EXTRACT(valueB, 1, 32000)
    Set difference.Details = $SELECT(differenceType="CHANGED":"Line values differ", differenceType="ADDED":"Line exists only in file B", 1:"Line exists only in file A")
    set res = difference.%Save()
    Set differenceID = difference.%Id()
    WRITE !, "Save: " _ res
    Quit res
}

ClassMethod SaveFieldDifferences(runID As %Integer, parentDifferenceID As %Integer, lineA As %Integer, lineB As %Integer, valueA As %String, valueB As %String) As %Status
{
    Kill fieldsA, fieldsB, namesA, namesB
    Set countA = ..ParseFields(valueA, .fieldsA, .namesA)
    Set countB = ..ParseFields(valueB, .fieldsB, .namesB)

    For index = 1:1:countA {
        Set fieldName = namesA(index)
        Set fieldRecordType = $Extract(fieldName, 2)
        If '$Data(fieldsB(fieldName)) {
            Set status = ..SaveFieldDifference(runID, parentDifferenceID, "MISSING_IN_B", fieldRecordType, fieldName, lineA, lineB, fieldsA(fieldName), "")
        } ElseIf fieldsA(fieldName) '= fieldsB(fieldName) {
            Set status = ..SaveFieldDifference(runID, parentDifferenceID, "CHANGED", fieldRecordType, fieldName, lineA, lineB, fieldsA(fieldName), fieldsB(fieldName))
        } Else {
            Continue
        }
        If $$$ISERR(status) {
            Quit status
        }
    }
    For index = 1:1:countB {
        Set fieldName = namesB(index)
        If '$Data(fieldsA(fieldName)) {
            Set fieldRecordType = $Extract(fieldName, 2)
            Set status = ..SaveFieldDifference(runID, parentDifferenceID, "MISSING_IN_A", fieldRecordType, fieldName, lineA, lineB, "", fieldsB(fieldName))
            If $$$ISERR(status) {
                Quit status
            }
        }
    }
    Quit $$$OK
}

ClassMethod SaveFieldDifference(runID As %Integer, parentDifferenceID As %Integer, differenceType As %String, recordType As %String, fieldName As %String, lineA As %Integer, lineB As %Integer, valueA As %String, valueB As %String) As %Status
{
    Set difference = ##class(KWCompare.CompareDifference).%New()
    Set difference.RunID = runID
    Set difference.ParentDifferenceID = parentDifferenceID
    Set difference.DifferenceType = differenceType
    Set difference.RecordType = recordType
    Set difference.FieldName = fieldName
    Set difference.OccurrenceNumber = $SELECT(lineA>lineB:lineA, 1:lineB)
    Set difference.FileALineNumber = lineA
    Set difference.FileBLineNumber = lineB
    Set difference.RecordKey = $SELECT(lineA>lineB:lineA, 1:lineB)
    Set difference.FileAValue = $EXTRACT(valueA, 1, 32000)
    Set difference.FileBValue = $EXTRACT(valueB, 1, 32000)
    Set difference.Details = "Field values differ"
    Quit difference.%Save()
}

ClassMethod ParseFields(line As %String, ByRef fields, ByRef names) As %Integer
{
    Set count = 0
    For index = 1:1:$Length(line, ",") {
        Set token = $Piece(line, ",", index)
        Set fieldName = $Piece(token, "=", 1)
        Set fieldValue = $Piece(token, "=", 2, $Length(token, "="))
        If $Extract(fieldName, 1) = "@" {
            Set fieldName = $Extract(fieldName, 2, $Length(fieldName))
        }
        If fieldName = "" {
            Continue
        }
        If $Extract(fieldValue, 1) = "'", $Extract(fieldValue, $Length(fieldValue)) = "'" {
            Set fieldValue = $Extract(fieldValue, 2, $Length(fieldValue) - 1)
        }
        Set count = count + 1
        Set names(count) = fieldName
        Set fields(fieldName) = fieldValue
    }
    Quit count
}

ClassMethod BaseName(path As %String) As %String
{
    Set slash = $LENGTH(path, "/")
    Set backslash = $LENGTH(path, "\\")
    Set separator = $SELECT(backslash>slash:"\\", 1:"/")
    Quit $PIECE(path, separator, $LENGTH(path, separator))
}


}
