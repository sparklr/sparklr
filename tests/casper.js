casper.test.begin('Sparklr.dev loads a new user', 5, function suite(test) {
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
        casper.run(function() {
                test.done();
        });
});
