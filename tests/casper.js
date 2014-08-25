casper.test.begin('Sparklr.dev loads a new user', 2, function suite(test) {
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
        casper.run(function() {
                test.done();
        });
});
