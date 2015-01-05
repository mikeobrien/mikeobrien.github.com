---
published: true
layout: post
title: Configuring Integrated Security for a TeamCity SQL Database
tags: [TeamCity]
---

[Configuring integrated security for a TeamCity database is pretty simple](http://confluence.jetbrains.com/display/TCD8/Setting+up+an+External+Database#SettingupanExternalDatabase-MicrosoftSQLServer) but if you don't get it just right you'll get this error without further explanation:

    SQL error when doing: Connecting to MSSQL: This driver is not configured for integrated authentication.

Here is how to set it up:

*Note:* I'll be refering to the TeamCity home and data directories. Typically they will be under `C:\Program Files\TeamCity` but may be under different paths on your system. See [here](http://confluence.jetbrains.com/display/TCD8/TeamCity+Data+Directory) and [here](http://confluence.jetbrains.com/display/TCD8/TeamCity+Specific+Directories) for more info.

1. Download the [Microsoft JDBC Driver for SQL Server](http://msdn.microsoft.com/en-us/sqlserver/aa937724.aspx) and extract the files.
2. Copy the `\sqljdbc4.jar` file to the `<TeamCityDataDir>\lib\jdbc` folder (You will have to create the `jdbc` folder).

If you are running a 32 bit OS:

3. Copy the `\auth\x32\sqljdbc_auth.dll` file (Note the `x32` in the path) to the `<TeamCityHomeDir>\bin` folder.

If you are running a 64 bit OS:

4. Copy the `\auth\x64\sqljdbc_auth.dll` file (Note the `x64` in the path) to the `<TeamCityHomeDir>\bin` folder.
5. Download the 64 bit Windows `tar.gz` version (*Not the installer*) of the JRE [here](http://www.oracle.com/technetwork/java/javase/downloads/jre7-downloads-1880261.html) and uncompress it. Depending on your compression tool you may have to then extract the files from the tar archive (Which may not have an extension) as a second step. [7-zip](http://www.7-zip.org/) will do this.
6. Delete the contents of the `<TeamCityHomeDir>\jre` folder.
7. Copy the JRE that you extracted in the previous step to the `<TeamCityHomeDir>\jre` folder. The JRE is one folder deep in the archive so don't just directly copy the folder that is extracted. Your `<TeamCityHomeDir>\jre` folder should contain a `bin` and `libs` folder.
8. Make a backup of your `<TeamCityHomeDir>\jre` folder under `<TeamCityHomeDir>\jre\x64` (Or wherever you prefer). TeamCity upgrades overwrite the the JRE with the 32 bit version, so you'll want to have a copy handy so you can replace it after updates.

Finally restart TeamCity and you should be golden.

As mentioned above when you upgrade TeamCity, the `jre` folder is overwritten with the 32 bit version of the JRE. So if you're using the 64 bit version this will lead to the following error:

![TeamCity Upgrade Error](/blog/images/TeamCityUpgradeError.png)

You will need to stop the TeamCity server and agents, replace the `x32` version with the `x64` version as described above, and restart the services.

Thanks to [dneelyep](http://disqus.com/dneelyep/) for his corrections.

