---
published: true
layout: post
title: Configuring Integrated Security for a TeamCity SQL Database
tags: [TeamCity]
---

[Configuring integrated security for a TeamCity database is pretty simple](http://confluence.jetbrains.com/display/TCD8/Setting+up+an+External+Database#SettingupanExternalDatabase-MicrosoftSQLServer) but if you don't get it just right you'll get this error without further explanation:

    SQL error when doing: Connecting to MSSQL: This driver is not configured for integrated authentication.

Here is how to set it up:

1. Download the [Microsoft JDBC Driver for SQL Server](http://msdn.microsoft.com/en-us/sqlserver/aa937724.aspx) and extract it to a folder.
2. Copy `\sqljdbc4.jar` from there to your [TeamCity data directory](http://confluence.jetbrains.com/display/TCD8/TeamCity+Data+Directory) under `\lib\jdbc` (You will have to create the `jdbc` folder).

If you are running a 32 bit OS:

3. Copy the `\auth\x32\sqljdbc_auth.dll` (Note the `x32` in the path) from the JDBC driver folder to your `C:\Windows\System32` folder (Or some location in the system path).

If you are running a 64 bit OS:

3. Copy the `\auth\x64\sqljdbc_auth.dll` (Note the `x64` in the path) from the JDBC driver folder to your `C:\Windows\System32` folder (Or some location in the system path).
4. Copy the contents of the `jre` folder under the [TeamCity home directory](http://confluence.jetbrains.com/display/TCD8/TeamCity+Specific+Directories) (By default `C:\Program Files\TeamCity\`) into `jre\x86` as a backup.
5. Download the 64 bit Windows `tar.gz` version (*Not the installer*) of the JRE [here](http://www.oracle.com/technetwork/java/javase/downloads/jre7-downloads-1880261.html) and extract it to a folder. Depending on your compression tool you may have to uncompress and then extract the tar archive in two separate steps. [7-zip](http://www.7-zip.org/) will do this.
6. Copy the JRE that you extracted to `C:\Program Files\TeamCity\jre` folder. The JRE is one folder deep in the archive so don't just directly copy the folder that is extracted. Your `C:\Program Files\TeamCity\jre` folder should end up with a `bin` and `libs` folder.

Finally restart TeamCity and you should be golden.

Thanks to [dneelyep](http://disqus.com/dneelyep/) for his corrections.
