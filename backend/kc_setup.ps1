$ErrorActionPreference='Stop'
$kc='http://localhost:8180'
$realm='logiway'
$client='logiway'
$email='logiAdmin@logiway.com'
$pass='logiwayadmin'

$adminToken=(Invoke-RestMethod -Uri "$kc/realms/master/protocol/openid-connect/token" -Method Post -UseBasicParsing -ContentType 'application/x-www-form-urlencoded' -Body 'grant_type=password&client_id=admin-cli&username=admin&password=admin').access_token
$h=@{Authorization="Bearer $adminToken"}
$hj=@{Authorization="Bearer $adminToken"; 'Content-Type'='application/json'}

$realmExists=$true
try{ Invoke-RestMethod -Uri "$kc/admin/realms/$realm" -Headers $h -Method Get -UseBasicParsing | Out-Null }catch{ $realmExists=$false }
if(-not $realmExists){
  Invoke-RestMethod -Uri "$kc/admin/realms" -Headers $hj -Method Post -UseBasicParsing -Body '{"realm":"logiway","enabled":true}' | Out-Null
  Write-Output 'REALM_CREATED'
}else{ Write-Output 'REALM_OK' }

$roleExists=$true
try{ Invoke-RestMethod -Uri "$kc/admin/realms/$realm/roles/SUPERADMIN" -Headers $h -Method Get -UseBasicParsing | Out-Null }catch{ $roleExists=$false }
if(-not $roleExists){
  Invoke-RestMethod -Uri "$kc/admin/realms/$realm/roles" -Headers $hj -Method Post -UseBasicParsing -Body '{"name":"SUPERADMIN"}' | Out-Null
  Write-Output 'ROLE_CREATED'
}else{ Write-Output 'ROLE_OK' }

$clients=Invoke-RestMethod -Uri "$kc/admin/realms/$realm/clients?clientId=$client" -Headers $h -Method Get -UseBasicParsing
if(-not $clients -or $clients.Count -eq 0){
  $cp='{"clientId":"logiway","enabled":true,"publicClient":true,"directAccessGrantsEnabled":true,"standardFlowEnabled":false,"serviceAccountsEnabled":false,"protocol":"openid-connect"}'
  Invoke-RestMethod -Uri "$kc/admin/realms/$realm/clients" -Headers $hj -Method Post -UseBasicParsing -Body $cp | Out-Null
  Write-Output 'CLIENT_CREATED'
}else{
  $cid=$clients[0].id
  $cur=Invoke-RestMethod -Uri "$kc/admin/realms/$realm/clients/$cid" -Headers $h -Method Get -UseBasicParsing
  $cur.publicClient=$true
  $cur.directAccessGrantsEnabled=$true
  $cur.standardFlowEnabled=$false
  $cur.serviceAccountsEnabled=$false
  Invoke-RestMethod -Uri "$kc/admin/realms/$realm/clients/$cid" -Headers $hj -Method Put -UseBasicParsing -Body ($cur|ConvertTo-Json -Depth 20) | Out-Null
  Write-Output 'CLIENT_UPDATED'
}

$users=Invoke-RestMethod -Uri "$kc/admin/realms/$realm/users?username=$email" -Headers $h -Method Get -UseBasicParsing
if(-not $users -or $users.Count -eq 0){
  $up = @{
    username = $email
    email = $email
    enabled = $true
    emailVerified = $true
    firstName = 'Logi'
    lastName = 'Admin'
  } | ConvertTo-Json
  Invoke-RestMethod -Uri "$kc/admin/realms/$realm/users" -Headers $hj -Method Post -UseBasicParsing -Body $up | Out-Null
  $users=Invoke-RestMethod -Uri "$kc/admin/realms/$realm/users?username=$email" -Headers $h -Method Get -UseBasicParsing
  Write-Output 'USER_CREATED'
}else{ Write-Output 'USER_OK' }
$uid=$users[0].id

$pp = @{
  type = 'password'
  value = $pass
  temporary = $false
} | ConvertTo-Json
Invoke-RestMethod -Uri "$kc/admin/realms/$realm/users/$uid/reset-password" -Headers $hj -Method Put -UseBasicParsing -Body $pp | Out-Null
Write-Output 'PASSWORD_SET'

$role=Invoke-RestMethod -Uri "$kc/admin/realms/$realm/roles/SUPERADMIN" -Headers $h -Method Get -UseBasicParsing
$mp = @(
  @{
    id = $role.id
    name = 'SUPERADMIN'
  }
) | ConvertTo-Json
Invoke-RestMethod -Uri "$kc/admin/realms/$realm/users/$uid/role-mappings/realm" -Headers $hj -Method Post -UseBasicParsing -Body $mp | Out-Null
Write-Output 'ROLE_ASSIGNED'

$probeBody="grant_type=password&client_id=$client&username=$email&password=$pass"
$probe=Invoke-WebRequest -Uri "$kc/realms/$realm/protocol/openid-connect/token" -Method Post -UseBasicParsing -ContentType 'application/x-www-form-urlencoded' -Body $probeBody
Write-Output ("TOKEN_STATUS=" + $probe.StatusCode)
