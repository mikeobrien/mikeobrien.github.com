---
layout: lab
title: Lab
---

### Introduction

Building scientific apparatus can be challenging when you are first starting out. The purpose of this site to act as a living lab book to help experimenters get up to speed on a few technologies and techniques. 

**DISCLAIMER**: I am not an experimental physicist or electrical engineer. Although I do my best to present the material as accurately as possible I cannot make any guarantees. Also some experiments involve very high voltages (> 100kV) which can seriously injure or kill. YOU are responsible for educating yourself and for your own safety.

### <a id="learning-resources"></a> Learning Resources

The following resources have been very helpful in general. I will note resources that cover specific topics in their respective sections on the site.

- [Exploring Quantum Physics through Hands-on Projects](http://www.amazon.com/Exploring-Quantum-Physics-through-Projects/dp/1118140664) - David and Shanni Prutchi. Most of the content on this site is designed to complement this book, not replace it. So I would highly recommend picking up a copy as it contains a lot of information that I won't cover here. Also take a look at [their website](http://www.diyphysics.com/) as it contains quite a bit of supplementary information.

- [Building Scientific Apparatus](http://www.amazon.com/Building-Scientific-Apparatus-John-Moore/dp/0521878586) - John H. Moore, Christopher C. Davis, Michael A. Coplan, Sandra C. Greer. This book contains general info on everything about building apparatus; fabricating, vacuum, electronics, optics and more. Although it is not super in depth on any of the topics it does give you a good overview.

- [Introduction to Solid State Chemistry](https://www.youtube.com/watch?v=kI7D2lkcF8E&list=PL36EC6A6180271B0F) - [Donald Sadoway, MIT Department of Materials Science and Engineering](http://donaldsadoway.com/). Don't let the title fool you, this isn't your father's first year chemistry course. Sadoway is an amazing lecturer who really makes the material come alive. Lectures 1-14 cover quantum theory and condensed matter physics. The lectures on organic and biochemistry are also fantastic.

- [Modern Physics: From The Atom to Big Science](https://itunes.apple.com/us/itunes-u/history-181b-spring-2008-modern/id461116019) - [Cathryn Carson, Berkley Department of History](http://history.berkeley.edu/people/cathryn-carson). This is a truly unique course that digs into the history of physics starting with Newton and on into the 21st century. She does a masterful job of explaining the relevant physics as well as the social and political context. I've listened to these over and over and glean something new each time. I've found that understanding the historical development and the people involved make learning the technical details much more fun and interesting. The discussion on radiation and quantum physics in lectures 12-15 and 20-26 is highly relevant to the content on this site.

- [Fundamentals of Physics II](http://www.youtube.com/playlist?list=PLD07B2225BB40E582) - [Ramamurti Shankar](http://pantheon.yale.edu/~rshankar/). This lecture series covers E&M and quantum physics. Shankar really does a fantastic job of breaking these concepts down so they are easy to understand. This is the second part of the lecture series [Fundamentals of Physics I](http://www.youtube.com/course?list=ECFE3074A4CB751B2B) which covers classical concepts and relativity.

- [Theoretical Concepts in Physics](http://www.amazon.com/Theoretical-Concepts-Physics-Alternative-Reasoning/dp/052152878X) - [Malcolm Longair](http://www.phy.cam.ac.uk/people/longairm.php). This fantastic text takes you through the history of physics, closely examining a number pivotal theories and their development. Chapters 11-15 on quantum theory are highly relevant to the content on this site.

- [Richard Feynman: Fun to Imagine](https://www.youtube.com/watch?v=GqvggMpJgL0) - And of course some Feynman for inspiration!

### <a id="supplies"></a> Materials & Supplies

Finding and purchasing materials & supplies can be challenging at first. The most cost effective approach, of course, is to buy surplus and [eBay](http://www.ebay.com/) has been the best place I've found for it. The following are a few tips for shopping for surplus on eBay:

- Always checkout the sellers negative and neutral reviews no matter what their feedback score is. The feedback score is a pretty poor indicator IMO. I've gotten burned a few times and if I would have looked at the negative reviews I would have saved myself a lot of trouble. You want to see how they handle customer service when something goes wrong and thats where you will see it. Two sellers in particular I would avoid are [supertechshop](http://www.ebay.com/usr/supertechshop) and [svcstore](http://www.ebay.com/usr/svcstore), both eBay stores for [Silicon Valley Compucycle](http://www.svc.com/). Read supertechshop's [negative reviews](http://feedback.ebay.com/ws/eBayISAPI.dll?ViewFeedback2&userid=supertechshop&myworld=true&items=25&iid=-1&de=off&which=negative&interval=365) and you'll understand why.

- Use the eBay RSS feeds to keep on top of new listings. You may decide to patiently wait for something to show up on eBay and this beats manually searching for the same items every day. Do a search on eBay and then tack on `&_rss=1` to the url and it will return RSS for that search. You can then use a feed reader or other method to keep up with new listings. I personally use [IFTTT](https://ifttt.com) to post the RSS feed to a private twitter feed that I follow.

- See how much the item has sold for in the past so you can get an idea of how much it will cost. Under the advanced search you will see an option for sold listings.

- When listings have a Make Offer option don't be afraid to make a really low offer, even up to 80%. Some sellers are just trying to move surplus and are not necessarily sure how much its worth. Not every seller will go low but its always worth a try. I regularly get fantastic deals this way.

- Use the OR notation when doing searches. One example of this is looking for KF style vacuum fittings as they can be called NW, QF or KF. The OR notation is a comma separated list surrounded by parenthesis. So if I wanted to search for a KF-25 tee I could search `(qf,kf,nw) 25 tee` and it will return all results no matter what the seller called it.

- Make sure the seller will do a DOA return. 

- Be aware of where it's shipping from. I usually start out filtering the location by US only, then expand out if I can't find what I'm looking for. There are a lot of cheap listings out of China but expect weeks for delivery time. I've accidentally done this; not fun waiting a month for a part.

If you can't find what you need surplus then you're stuck buying new. For common items I've found both [eBay](http://www.ebay.com) and [Amazon](http://amazon.com) to be invaluable. Amazon even has an [industrial and scientific department](http://www.amazon.com/industrial-scientific-supplies/b?node=16310091). I usually compare prices on those two sites. If you need specialized items, here are a couple of things you'll need to know:

- Some vendors like [Ace Glass](http://www.aceglass.com/) and [Kurt J. Lesker](http://www.lesker.com/) will only sell to businesses or will not ship to residential addresses. Despite these restrictions you may be able to get an account with these vendors and have them ship to your home address. You will need to fill out the new account form on their website and submit it. They require a business name and I just use the business name I do occasional consulting with, though its not an official business with a tax id and such. They will respond saying they only sell to businesses or don't ship to residential addresses and they ask for some proof that you are a business, like your tax id number. Call the rep (It's better than emailing) and explain that you are building an apparatus, what the apparatus is and ask them if there is any way to purchase from them despite the restrictions. They may be flexible with you if they feel confident you are not using their products in an illegal way or not going to illegally export them. If you are not able to setup an account with them, ask if there is a reseller you can buy from or try contacting their regional sales rep and explain your situation as they might be better able to get you setup with an account.

- Many of these vendors sell large high ticket items so they will only ship UPS or FedEx and usually ship everything in boxes. They aren't really setup to sell small low dollar items. They also don't tell you the shipping up front (Unlike what you're used to on most modern e-commerce sites). That being said, you can end up paying pretty high shipping, in the $10-$15 dollar range, for even the smallest parts and you won't know the shipping amount until after you've placed your order and given them your CC. For example, I once bought an o-ring for a vacuum pump for $2 and the shipping was going to be FedEx for $12. I caught that before they charged my card and told them that was pretty steep shipping for an o-ring and could they just pop it in an envelope with a first class stamp. They agreed. Also you will want to minimize your purchases, so instead of buying a number of things separately, try figuring out what you need up front so you can place one order and combine shipping. And sometimes you just have to bite the bullet, but at least you'll see it coming now. Just remember it's not Amazon.com.

Here are some vendors you will want to be aware of:

- [Kurt J. Lesker](http://www.lesker.com/) - Sells all things vacuum. You can find a lot of Lesker items on eBay but you may need to order from them directly. They have account restrictions, see above.
- [Ace Glass](http://www.aceglass.com/) - Sells laboratory glassware. In particular, internally threaded glassware and components that can be easily put together to build vacuum chambers. You can also find quite a bit of their products on eBay. They have account restrictions, see above.
- [Ideal Vacuum Products](http://www.idealvac.com/) - Sells a wide range of vacuum components. If you can't find it on eBay they probably have it.
- [Information Unlimited](http://amazing1.com/) - Has a large selection of high voltage equipment, components and other interesting items.
- [Ocean Optics](http://www.oceanoptics.com/) - Makers of miniature USB spectrometers. These can be found on eBay for a fraction of the cost.

The last thing I want to mention is that materials and supplies are not cheap, even when you get them as surplus at a fraction of the cost. These are big boy toys with big boy prices. I've read some reviews of [Exploring Quantum Physics through Hands-on Projects](http://www.amazon.com/Exploring-Quantum-Physics-through-Projects/dp/1118140664) that lament this so I want to make this clear up front. The Exploring Quantum Physics book does a pretty good job of keeping things as low cost as possible and I try do that on this site as well. I will also include the prices I paid for things to give you an idea of how much things will cost so you can decide if you want to build an apparatus or not. I will also try to help you understand the technologies so you don't make mistakes buying the wrong things (like I've done a few times). This should also help keep your costs low.