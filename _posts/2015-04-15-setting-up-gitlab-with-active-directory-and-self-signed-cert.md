---
layout: post
title: Setting up GitLab with Active Directory and a Self Signed Cert
tags: [Git,GitLab]
---

I really love GitHub but unfortunately not every organization can host code outside of their network or justify the cost of GitHub Enterprise (Which starts at [$400+ p/m](https://enterprise.github.com/features#pricing)). After trying out some different packages, [GitLab](https://about.gitlab.com/) is the only thing that even comes close to GitHub for internal use without breaking the bank ([Free Community Edition](https://about.gitlab.com/features/) or [starting at $34 p/m for Enterprise](https://about.gitlab.com/pricing/)). In fact the free community edition [would probably be sufficient for most organizations](https://about.gitlab.com/features/#compare). Below I outline setting up GitLab on Ubuntu 14.04 with Active Directory integration and a self signed cert.

### Install

The following installation instructions are taken from the [download page](https://about.gitlab.com/downloads/). Be sure to download the latest version of GitLab.

```bash
sudo apt-get install openssh-server

# Omit if using an existing SMTP server
sudo apt-get install postfix

wget https://downloads-packages.s3.amazonaws.com/ubuntu-14.04/gitlab_7.9.2-omnibus-1_amd64.deb
sudo dpkg -i gitlab_7.9.2-omnibus-1_amd64.deb

# If this fails, reboot and try again
sudo gitlab-ctl reconfigure
```

Browse to your server and make sure everything is up and running. Login as `root`/`5iveL!fe` and change the default password. Also disable sign ups (Admin area > Settings > Signup enabled).

### Configure Email

The following enables email delivery and sets basic options:

```bash
sudo vim /etc/gitlab/gitlab.rb
```

```ruby
 gitlab_rails['gitlab_email_enabled'] = true
 gitlab_rails['gitlab_email_from'] = 'gitlab@mydomain.int'
 gitlab_rails['gitlab_email_display_name'] = 'GitLab'
```

If you you are sending through an existing SMTP server, configure as follows (See [here](https://gitlab.com/gitlab-org/omnibus-gitlab/blob/master/doc/settings/smtp.md) for more options):

```ruby
 gitlab_rails['smtp_enable'] = true
 gitlab_rails['smtp_address'] = "smtp.mydomain.int"
 gitlab_rails['smtp_port'] = 25
```

Finally reconfigure for the changes to take effect.

```bash
sudo gitlab-ctl reconfigure
```

Unfortunately there isn't a test email button anywhere, but you can add an SSH key as this sends a notification.

### Configure Active Directory Integration

In order to integrate with Active Directory you will need to either have [anonymous queries enabled](https://support.microsoft.com/en-us/kb/320528) or create a domain account with query access. By default members of the `Domain Users` group have this.

```bash
sudo vim /etc/gitlab/gitlab.rb
```

Configure the basic settings, see [here](https://gitlab.com/gitlab-org/gitlab-ce/blob/master/doc/integration/ldap.md) for more details and settings.

```ruby
 gitlab_rails['ldap_enabled'] = true
 gitlab_rails['ldap_servers'] = YAML.load <<-'EOS'
   main: # 'main' is the GitLab 'provider ID' of this LDAP server
     label: 'My Organization' # Label shown on the login page
     host: 'ad1.mydomain.int' # AD server
     port: 389
     uid: 'sAMAccountName'
     method: 'plain' # "tls" or "ssl" or "plain"
     bind_dn: 'GitLab' # AD user that has query access
     password: 'P@$$w0rd' # Password of said user
     active_directory: true
     allow_username_or_email_login: false
     base: 'CN=Users,DC=mydomain,DC=int'
     user_filter: '' # Leave blank if not used
 EOS
```

Next, run the following to propagate the changes and ensure configuration is correct.

```bash
sudo gitlab-ctl reconfigure
sudo gitlab-rake gitlab:ldap:check RAILS_ENV=production
```

If so, you should see a list of users that match the base and filter:

```bash
Checking LDAP ...

LDAP users with access to your GitLab server (only showing the first 100 results)
Server: ldapmain
     DN: CN=GitLab,CN=Users,DC=mydomain,DC=int  sAMAccountName: GitLab
     DN: CN=Guest,CN=Users,DC=mydomain,DC=int  sAMAccountName: Guest
     ...

Checking LDAP ... Finished
```

GitLab pulls user email addresses from AD so you will need to make sure these are set on users accessing GitLab. These cannot be modified in GitLab.

Now login to GitLab with your domain account and set up your profile. Next, log out and login to GitLab as root. Then give your domain account admin privileges (Admin area > Users > Edit > Admin).

### Configure SSL

Create the `ssl` folder where the cert will saved.

```bash
sudo mkdir -p /etc/gitlab/ssl
sudo chmod 700 /etc/gitlab/ssl
```

Create a self signed cert as outlined below or if you have a cert, copy the `crt` and `key` files into the `ssl` folder as `code.mydomain.com.crt` and `code.mydomain.com.key` respectively.

```bash
sudo openssl genrsa -out "/etc/gitlab/ssl/code.mydomain.int.key" 2048
sudo openssl req -new -key "/etc/gitlab/ssl/code.mydomain.int.key" -out "gitlab.csr"

# Country Name (2 letter code) [AU]:US
# State or Province Name (full name) [Some-State]:Maryland
# Locality Name (eg, city) []:Fort Meade
# Organization Name (eg, company) [Internet Widgits Pty Ltd]:Setec Astronomy
# Organizational Unit Name (eg, section) []:Research  
# Common Name (e.g. server FQDN or YOUR name) []:code.mydomain.int
# Email Address []:me@mydomain.int
# A challenge password []:
# An optional company name []:

sudo openssl x509 -req -days 3650 -in "gitlab.csr" \
     -signkey "/etc/gitlab/ssl/code.mydomain.int.key" \
     -out "/etc/gitlab/ssl/code.mydomain.int.crt"

sudo rm "gitlab.csr"
```

Now configure SSL.

```bash
sudo vim /etc/gitlab/gitlab.rb
```

```ruby
 external_url 'https://code.mydomain.int'
 ...
 nginx['redirect_http_to_https'] = true
```

Now add the SSL exception to the firewall and propagate configuration changes and restart nginx.

```bash
# Enable SSL in the firewall
sudo ufw allow https

sudo gitlab-ctl reconfigure
sudo gitlab-ctl restart
```

You should now be able to access GitLab over SSL. 

### Reverse Proxy with SSL

If instead you have SSL setup through a reverse proxy you can change the default url to be `https` but you will need to disable SSL in nginx.

```bash
sudo vim /etc/gitlab/gitlab.rb
```

```ruby
 external_url 'https://code.mydomain.com'
 ...
 nginx['listen_https'] = false
```

```bash
sudo gitlab-ctl reconfigure
```