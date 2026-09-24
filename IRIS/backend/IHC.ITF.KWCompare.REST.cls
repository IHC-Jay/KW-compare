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
<Route Url="/configs" Method="GET" Call="GetConfigs" />
<Route Url="/configs/:id" Method="GET" Call="GetConfig" />
<Route Url="/configs" Method="POST" Call="CreateConfig" />
<Route Url="/configs/:id" Method="PUT" Call="UpdateConfig" />
<Route Url="/configs/:id/fields" Method="PUT" Call="SaveConfigFields" />
<Route Url="/files" Method="OPTIONS" Call="Options" />
<Route Url="/directories" Method="OPTIONS" Call="Options" />
<Route Url="/processX12" Method="OPTIONS" Call="Options" />
<Route Url="/runs" Method="OPTIONS" Call="Options" />
<Route Url="/runs/:id" Method="OPTIONS" Call="Options" />
<Route Url="/runs/:id/differences" Method="OPTIONS" Call="Options" />
<Route Url="/configs" Method="OPTIONS" Call="Options" />
<Route Url="/configs/:id" Method="OPTIONS" Call="Options" />
<Route Url="/configs/:id/fields" Method="OPTIONS" Call="Options" />
</Routes>
}

ClassMethod OnPreHTTP() As %Boolean
{
    Set origin = $Get(%request.CgiEnvs("HTTP_ORIGIN"))
    If ..IsAllowedOrigin(origin) {
        Set requestedHeaders = $Get(%request.CgiEnvs("HTTP_ACCESS_CONTROL_REQUEST_HEADERS"))
        If requestedHeaders = "" {
            Set requestedHeaders = "Content-Type, Authorization"
        }
        Set %response.Headers("Access-Control-Allow-Origin") = origin
        Set %response.Headers("Access-Control-Allow-Headers") = requestedHeaders
        Set %response.Headers("Access-Control-Allow-Methods") = "GET, POST, OPTIONS"
        Set %response.Headers("Access-Control-Max-Age") = "600"
        Set %response.Headers("Vary") = "Origin"
    }
    Quit 1
}

ClassMethod IsAllowedOrigin(origin As %String) As %Boolean
{
    Set origin = $ZCONVERT($Get(origin),"L")
    If origin = "" Quit 0
    If origin = "null" Quit 1

    Set scheme = $Piece(origin,"://",1)
    If scheme'="http",scheme'="https" Quit 0

    Set hostPort = $Piece($Piece(origin,"://",2),"/",1)
    Set host = $Piece(hostPort,":",1)
    Set port = $Piece(hostPort,":",2)
    If port'="",port'?1.N Quit 0

    If host="localhost" Quit 1
    If host="127.0.0.1" Quit 1
    If host="lpv-itfwin12" Quit 1
    If host="itf-webapache-dev.co.ihc.com" Quit 1
    If $Length(host)>11,$Extract(host,$Length(host)-10,*)=".co.ihc.com" Quit 1

    Quit 0
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
    Set selectedConfigID = +$Get(%request.Data("configID",1))
    Set status = ##class(IHC.ITF.KWCompare.RESTImpl).GetDifferences(id, .response, selectedConfigID)
    If $IsObject(response), response.%IsDefined("error") {
        Set %response.Status = 404
    }
    Do ..WriteJSON(response)
    Quit $$$OK
}

ClassMethod GetConfigs() As %Status
{
    Set status = ##class(IHC.ITF.KWCompare.RESTImpl).GetConfigs(.response)
    Do ..WriteJSON(response)
    Quit status
}

ClassMethod GetConfig(id As %Integer) As %Status
{
    Set status = ##class(IHC.ITF.KWCompare.RESTImpl).GetConfig(id, .response)
    If $IsObject(response), response.%IsDefined("error") {
        Set %response.Status = 404
    }
    Do ..WriteJSON(response)
    Quit $$$OK
}

ClassMethod CreateConfig() As %Status
{
    Set request = {}.%FromJSON(%request.Content.Read())
    Set status = ##class(IHC.ITF.KWCompare.RESTImpl).CreateConfig(request, .response)
    Set %response.Status = 201
    Do ..WriteJSON(response)
    Quit status
}

ClassMethod UpdateConfig(id As %Integer) As %Status
{
    Set request = {}.%FromJSON(%request.Content.Read())
    Set status = ##class(IHC.ITF.KWCompare.RESTImpl).UpdateConfig(id, request, .response)
    If $IsObject(response), response.%IsDefined("error") {
        Set %response.Status = 404
    }
    Do ..WriteJSON(response)
    Quit $$$OK
}

ClassMethod SaveConfigFields(id As %Integer) As %Status
{
    Set request = {}.%FromJSON(%request.Content.Read())
    Set status = ##class(IHC.ITF.KWCompare.RESTImpl).SaveConfigFields(id, request, .response)
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
