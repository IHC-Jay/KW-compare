Class IHC.ITF.KWCompare.REST Extends %CSP.REST
{

Parameter UseSession As Integer = 0;

XData UrlMap [ XMLNamespace = "http://www.intersystems.com/urlmap" ]
{
<Routes>
<Route Url="/files" Method="POST" Call="CompareFiles" />
<Route Url="/directories" Method="POST" Call="CompareDirectories" />
<Route Url="/processX12" Method="POST" Call="ProcessX12" />
<Route Url="/runs" Method="GET" Call="GetRuns" />
<Route Url="/runs/:id" Method="GET" Call="GetRun" />
<Route Url="/runs/:id/differences" Method="GET" Call="GetDifferences" />
<Route Url="/files" Method="OPTIONS" Call="Options" />
<Route Url="/directories" Method="OPTIONS" Call="Options" />
<Route Url="/processX12" Method="OPTIONS" Call="Options" />
<Route Url="/runs" Method="OPTIONS" Call="Options" />
<Route Url="/runs/:id" Method="OPTIONS" Call="Options" />
<Route Url="/runs/:id/differences" Method="OPTIONS" Call="Options" />
</Routes>
}

ClassMethod OnPreHTTP() As %Boolean
{
    Set origin = $Get(%request.CgiEnvs("HTTP_ORIGIN"))
    If origin = "http://localhost:4173" {
        Set %response.Headers("Access-Control-Allow-Origin") = origin
        Set %response.Headers("Access-Control-Allow-Headers") = "Content-Type, Authorization"
        Set %response.Headers("Access-Control-Allow-Methods") = "GET, POST, OPTIONS"
        Set %response.Headers("Access-Control-Max-Age") = "600"
    }
    Quit 1
}

ClassMethod Options() As %Status
{
    Set %response.Status = 204
    Quit $$$OK
}

ClassMethod CompareFiles() As %Status
{
    Set request = {}.%FromJSON(%request.Content.Read())
    Set status = ##class(IHC.ITF.KWCompare.RESTImpl).CompareFiles(request, .response)
    Do ..WriteJSON(response)
    Quit status
}

ClassMethod CompareDirectories() As %Status
{
    Set request = {}.%FromJSON(%request.Content.Read())
    Set status = ##class(IHC.ITF.KWCompare.RESTImpl).CompareDirectories(request, .response)
    Do ..WriteJSON(response)
    Quit status
}

ClassMethod ProcessX12() As %Status
{
    Set request = {}.%FromJSON(%request.Content.Read())
    Set status = ##class(IHC.ITF.KWCompare.RESTImpl).ProcessX12(request, .response)
    Do ..WriteJSON(response)
    Quit status
}

ClassMethod GetRuns() As %Status
{
    Set status = ##class(IHC.ITF.KWCompare.RESTImpl).GetRuns(.response)
    Do ..WriteJSON(response)
    Quit status
}

ClassMethod GetRun(id As %Integer) As %Status
{
    Set status = ##class(IHC.ITF.KWCompare.RESTImpl).GetRun(id, .response)
    If $IsObject(response), response.%IsDefined("error") {
        Set %response.Status = 404
    }
    Do ..WriteJSON(response)
    Quit $$$OK
}

ClassMethod GetDifferences(id As %Integer) As %Status
{
    Set status = ##class(IHC.ITF.KWCompare.RESTImpl).GetDifferences(id, .response)
    If $IsObject(response), response.%IsDefined("error") {
        Set %response.Status = 404
    }
    Do ..WriteJSON(response)
    Quit $$$OK
}

ClassMethod WriteJSON(value As %DynamicObject) As %Status
{
    Set %response.ContentType = "application/json"
    Write value.%ToJSON()
    Quit $$$OK
}

}
