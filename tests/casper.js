var mockStrings = require("./mockstrings");

casper.test.begin('Sparklr.dev loads a new user', 8, function suite(test) {
        casper.start("http://sparklr.dev:8080/", function() {
                test.assertTitle("Sparklr", "Page has correct title");
                this.click("#welcomebar a");
        });
        casper.then(function() {
                test.assertExists("form.settings", "Settings form is shown");

                this.sendKeys('input[name="username"]',"jonathan");
                this.sendKeys('input[name="displayname"]',"Jonathan");
                this.sendKeys('input[name="email"]',"jaxbot@gmail.com");
                this.click('#savesettings');
        });
        casper.then(function() {
                this.waitForText("Saved", function() {
                        test.assertFieldCSS("#savesettings", "Saved", "Settings button changes to saved");
                });
        });
        casper.then(function() {
                this.click('a[href="#/settings/password"]');
        });
        casper.then(function() {
                test.assertUrlMatch(/password/, 'Password page has been navigated to');
        });
        casper.then(function() {
                this.sendKeys('input[name="password1"]',"test");
                this.sendKeys('input[name="password2"]',"test");
                this.click('#savesettings');
        });
        casper.then(function() {
                this.waitForText("Saved", function() {
                        test.assertFieldCSS("#savesettings", "Saved", "Settings button changes to saved (Passwords)");
                });
        });
        casper.then(function() {
                this.click('#logo');
        });
        casper.then(function() {
                test.assertExists("#composer_composer", "Composer box exists");
                this.sendKeys('#composer_composer', mockStrings[0], { keepFocus: true });
                this.sendKeys('#composer_composer', casper.page.event.key.Enter, { keepFocus: true });
        });
        casper.then(function() {
                this.waitForResource(function(resource) {
                        return (resource.status == 200) && (resource.url.indexOf("/api/post") !== -1);
                }, function() {
                        this.waitForResource(function(resource) {
                                return (resource.status == 200) && (resource.url.indexOf("/api/beacon") !== -1);
                        }, function() {
                        });
                });
        });
        casper.thenOpen("http://sparklr.dev:8080/", function() {
                this.waitForText(mockStrings[0], function() {
                        test.assert(true, "Mock string inserted");
                }, null, 10000);
        });
        casper.then(function() {
                this.click(".timelineitem.fadein");
        });
        casper.then(function() {
                this.click(".composerframe textarea");
                this.sendKeys('.composerframe textarea', mockStrings[1], { keepFocus: true });
                this.sendKeys('.composerframe textarea', casper.page.event.key.Enter, { keepFocus: true });
                this.waitForText(mockStrings[1], function() {
                        test.assert(true, "Comment mock string inserted");
                });
        });
        casper.run(function() {
                test.done();
        });
});
