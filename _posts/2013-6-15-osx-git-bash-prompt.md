---
published: true
layout: post
title: Setting up git bash prompt on OSX
tags: [Git, Bash, OSX]
---

[This post](http://blog.kramerapps.com/post/40839091386/git-on-osx) has a nice rundown of setting up your git prompt on osx. I'm going to list an abridged version here with my own custom prompt.

First install git, turn on coloring and install the bash completion script:

```bash
brew install git
git config --global color.ui true
brew install bash-completion
```

Next add the following to your `~/.bash_profile`:

```bash
if [ -f $(brew --prefix)/etc/bash_completion ]; then
  . $(brew --prefix)/etc/bash_completion
fi
source $(brew --prefix)/etc/bash_completion.d/git-prompt.sh
PS1="\[\033[32m\]\@ \[\033[33m\]\w\$(__git_ps1 \" (\[\033[36m\]%s\[\033[33m\])\") \n\$\[\033[0m\] "
```

![OSX prompt with git support](/blog/images/git-bash-osx.png)
