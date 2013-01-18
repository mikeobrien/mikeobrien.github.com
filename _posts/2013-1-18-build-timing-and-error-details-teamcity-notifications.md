---
published: true
layout: post
title: Adding Build Time and Error Details to TeamCity Email Notifications
tags: [TeamCity]
---

**Updated links to TeamCity 7.x and added task timings section**

After setting up TeamCity I wanted to add some more information to the notification email. TeamCity allows you to customize all notifications (Not just email) through templates. The following resources were helpful in figuring out how to do this:

- [TeamCity: Customizing Notifications Templates](http://confluence.jetbrains.net/display/TCD7/Customizing+Notifications) 
- [TeamCity: Server-side Object Model](http://confluence.jetbrains.net/display/TCD7/Server-side+Object+Model) 
- [FreeMarker Manual (Templating engine)](http://freemarker.org/docs/index.html) 
 
First I wanted to add build time to the subject of successful build notifications so that we could easily monitor it. Just replace the `subject` directive at the top of `build_successful.ftl` with the following:

```html
<#global subject>${project.name} ${buildType.name} v${build.buildNumber} Succeeded

(${((build.duration / 60) % 60)}:${((build.duration) % 60)?string?left_pad(2, "0")})</#global>
```

This will give you a subject along the lines of: `Frogger Stable CI v1.0.0.331 Succeeded (11:58)`

Next I wanted to see a breakdown of the timing of all the build tasks. You can add this anywhere in the `bodyHtml` directive of `build_successful.ftl`:

```html
<b>Build Task Timings</b>
<br/>

<table border="0">
<#list build.buildLog.messages[1..] as message>
	<#if message.toString()?starts_with("$TARGET_BLOCK$") >
		<#assign start=message.timestamp?string("s")?number + 
					  (message.timestamp?string("m")?number * 60) + 
					  (message.timestamp?string("H")?number * 3600) + 
					  (message.timestamp?string("D")?number * 86400) + 
					  (message.timestamp?string("yy")?number * 31536000)>
		<#assign end=message.finishDate?string("s")?number + 
					(message.finishDate?string("m")?number * 60) + 
					(message.finishDate?string("H")?number * 3600) + 
					(message.finishDate?string("D")?number * 86400) + 
					(message.finishDate?string("yy")?number * 31536000)>
		<#assign duration=end-start>
		<tr>
		<td>${message.text?replace("Execute ", "")}</td>
		<td>${((duration / 60) % 60)}:${((duration) % 60)?string?left_pad(2, "0")}</td>
		<td align="right">${((duration / build.duration) * 100)?round}%</td>
		</tr>
	</#if>
</#list>
</table>
```

This will give you something along the lines of:

```
Build Task Timings 

assemblyInfo   0:00  0%
buildLibrary   0:00  0%
buildTests     0:02 14%
unitTestInit   0:00  0%
unitTests      0:08 57%
prepPackage    0:00  0%
createSpec     0:00  0%
createPackage  0:01  7%
```

When a build fails, TeamCity will include failed test results in the email but not other failure information. I wanted to also add the failure summary (Like the one seen on the build summary page) in every failed build notification. Add the following anywhere in the `bodyHtml` section of `build_failed.ftl`:

```html
<div style="color:red"> 
    <#list build.buildLog.messages[(build.buildLog.messages?size - 25)..] as message> 
        ${message.text?replace("\n", "\lbr/\g")}<br/> 
    </#list> 
</div> 
```

This will give you a notification along the lines of:

```
Build Frogger::Stable CI #1.0.0.336 failed 
Agent: ENDOR1

bt3 
Execute build_projects_ui 
RuntimeError: MSBuild Failed. See Build Log For Detail

Stacktrace: 
C:/.../gems/albacore-0.2.7/lib/albacore/support/failure.rb:12:in `fail_with_message' 
... stack trace ... 
C:/Program Files/TeamCity/BuildAgent1/plugins/rake-runner/lib/rb/runner/rakerunner.rb:40:in `' 
Rake aborted!

Changes included (2 changes). 
Change f735f1f299dc10005d8cc33d80003ea6915cbfa4 by mobrien (2 files): Added frog. 
Change 4b023210511568f5159a28e493ec01134285c363 by mobrien (1 file): Added cars.
```