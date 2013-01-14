var Imap = require("imap");

module.exports.configImap = config_mail_box;
module.exports.followersAsync = get_new_followers;

//collected followers
var flw_list = [];

//imap obj
var imap;
//callback function on success
var _callback;

//callback function on error
var _callback_err;

/**
 *  Configs imap account from which must fetch the twitter e-mails
 * @param config object containing information of imap account (user, password, host, port, secure boolean flag)
 */
function config_mail_box(config) {

    imap = new Imap({
        user:config.user,
        password:config.password,
        host:config.host,
        port:config.port,
        secure:config.secure
    });
}

/**
 * returns followers asynchronously
 *
 * @param since date from which to look for followers e-mails
 * @param cb callback function when there is a result
 * @param cberr callback function on error
 */

function get_new_followers(since, cb, cberr) {
    get_inbox(since);
    _callback = cb;
    _callback_err = cberr;
}

/**
 * call error callback function on error
 * @param why describing what went wrong
 */
function die(why) {
    _callback_err(why);
}

/**
 * open imap inbox and fetch mails
 * @param since date from which to look for followers e-mails
 */
function get_inbox(since) {
    imap.connect(function (err) {
        if (err)
            die(err);
        imap.openBox("INBOX", true, function (err, mailbox) {
            if (err)
                die(err);
            imap.search([
                [ 'HEADER', 'SUBJECT', 'is now following Twitter' ],
                [ 'SINCE', since ]
            ], function (err, results) {
                if (err)
                    die(err);
                imap.fetch(results, {
                    headers:[ 'subject' ],
                    body:false,
                    cb:function (fetch) {
                        fetch.on('message', function (msg) {
                            msg.on('headers', function (hdrs) {
                                match = hdrs.subject[0]
                                    .match(/@[a-z|A-Z|0-9|_]+/g);
                                flw_list.push(match.toString().substr(1));
                            });
                        });
                    }
                }, function (err) {
                    if (err)
                        throw err;
                    imap.logout();
                    return_list();
                });
            });
        });// imap openbox
    });// imap connect
}

/**
 * calls the callback function with collected results
 */
function return_list() {
    _callback(flw_list);
}

//some exceptions such as if imap search criteria does not match any mail
process.on('uncaughtException', function (err) {

    die(err);
});
 