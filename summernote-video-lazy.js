/**
 *
 * copyright 2022 [QRTIGER | Roselle Ebarle].
 * email: roselle@qrtiger.com
 * license: MIT
 *
 */
(function (factory) {
    /* Global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node/CommonJS
        module.exports = factory(require('jquery'));
    } else {
        // Browser globals
        factory(window.jQuery);
    }
}(function ($) {
    $.extend(true, $.summernote.lang, {
        'en-US': {
            audio: {
                audio: 'Lazy Video',
                insert: 'Insert Video',
                selectFromFiles: 'Select from files',
                url: 'Youtube Video ID',
                maximumFileSize: 'Maximum file size',
                maximumFileSizeError: 'Maximum file size exceeded.'
            }
        },
    });

    $.extend($.summernote.options, {
        audio: {
            icon: '<i class="note-icon-audio"><svg fill="#000000" xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 30 30" width="12px" height="12px">    <path d="M 15 4 C 10.814 4 5.3808594 5.0488281 5.3808594 5.0488281 L 5.3671875 5.0644531 C 3.4606632 5.3693645 2 7.0076245 2 9 L 2 15 L 2 15.001953 L 2 21 L 2 21.001953 A 4 4 0 0 0 5.3769531 24.945312 L 5.3808594 24.951172 C 5.3808594 24.951172 10.814 26.001953 15 26.001953 C 19.186 26.001953 24.619141 24.951172 24.619141 24.951172 L 24.621094 24.949219 A 4 4 0 0 0 28 21.001953 L 28 21 L 28 15.001953 L 28 15 L 28 9 A 4 4 0 0 0 24.623047 5.0546875 L 24.619141 5.0488281 C 24.619141 5.0488281 19.186 4 15 4 z M 12 10.398438 L 20 15 L 12 19.601562 L 12 10.398438 z"/></svg></i>'
        },
        callbacks: {
            onAudioUpload: null,
            onAudioUploadError: null,
            onAudioLinkInsert: null
        }
    });

    $.extend($.summernote.plugins, {
        /**
         *  @param {Object} context - context object has status of editor.
         */
        'audio': function (context) {
            var self = this,
                    // ui has renders to build ui elements
                    // for e.g. you can create a button with 'ui.button'
                    ui = $.summernote.ui,
                    $note = context.layoutInfo.note,
                    // contentEditable element
                    $editor = context.layoutInfo.editor,
                    $editable = context.layoutInfo.editable,
                    $toolbar = context.layoutInfo.toolbar,
                    // options holds the Options Information from Summernote and what we extended above.
                    options = context.options,
                    // lang holds the Language Information from Summernote and what we extended above.
                    lang = options.langInfo;

            context.memo('button.audio', function () {
                // Here we create a button
                var button = ui.button({

                    // icon for button
                    contents: options.audio.icon,

                    // tooltip for button
                    tooltip: lang.audio.audio,
                    click: function (e) {
                        context.invoke('audio.show');
                    }
                });
                return button.render();
            });

            this.initialize = function () {

                // This is how we can add a Modal Dialog to allow users to interact with the Plugin.

                // get the correct container for the plugin how it's attached to the document DOM.
                var $container = options.dialogsInBody ? $(document.body) : $editor;

                var audioLimitation = '';
                if (options.maximumAudioFileSize) {
                    var unit = Math.floor(Math.log(options.maximumAudioFileSize) / Math.log(1024));
                    var readableSize = (options.maximumAudioFileSize / Math.pow(1024, unit)).toFixed(2) * 1 +
                            ' ' + ' KMGTP'[unit] + 'B';
                    audioLimitation = '<small>' + lang.audio.maximumFileSize + ' : ' + readableSize + '</small>';
                }

                // Build the Body HTML of the Dialog.
                var body = [
                    '<div class="form-group note-group-image-url" style="overflow:auto;">',
                    '<label class="note-form-label">' + lang.audio.url + '</label>',
                    '<input class="note-audio-url form-control note-form-control note-input ',
                    ' col-md-12" type="text" />',
                    '</div>'
                ].join('');

                // Build the Footer HTML of the Dialog.
                var footer = '<button href="#" class="btn btn-primary note-audio-btn">' + lang.audio.insert + '</button>';

                this.$dialog = ui.dialog({

                    // Set the title for the Dialog. Note: We don't need to build the markup for the Modal
                    // Header, we only need to set the Title.
                    title: lang.audio.insert,

                    // Set the Body of the Dialog.
                    body: body,

                    // Set the Footer of the Dialog.
                    footer: footer

                            // This adds the Modal to the DOM.
                }).render().appendTo($container);
            };

            this.destroy = function () {
                ui.hideDialog(this.$dialog);
                this.$dialog.remove();
            };

            this.bindEnterKey = function ($input, $btn) {
                $input.on('keypress', function (event) {
                    if (event.keyCode === 13)
                        $btn.trigger('click');
                });
            };

            this.bindLabels = function () {
                self.$dialog.find('.form-control:first').focus().select();
                self.$dialog.find('label').on('click', function () {
                    $(this).parent().find('.form-control:first').focus();
                });
            };

            /**
             * @method readFileAsDataURL
             *
             * read contents of file as representing URL
             *
             * @param {File} file
             * @return {Promise} - then: dataUrl
             *
             * @todo this method already exists in summernote.js so we should use that one
             */
            this.readFileAsDataURL = function (file) {
                return $.Deferred(function (deferred) {
                    $.extend(new FileReader(), {
                        onload: function (e) {
                            var dataURL = e.target.result;
                            deferred.resolve(dataURL);
                        },
                        onerror: function (err) {
                            deferred.reject(err);
                        }
                    }).readAsDataURL(file);
                }).promise();
            };

            this.createAudio = function (url) {
                var pluginBody = [
                    '<div id="ytplaceholder">',
                    '<img className="ytcover" loading="lazy" src="https://i.ytimg.com/vi_webp/' + url + '/maxresdefault.webp">',
                    '<iframe id="ytiframe" data-src="https://www.youtube.com/embed/' + url + '"></iframe>',
                    '</div>'
                ]
                var $audio = $(pluginBody.join(''))
                return $audio;
            };

            this.insertAudio = function (src, param) {
                var $audio = self.createAudio(src);

                if (!$audio) {
                    context.triggerEvent('audio.upload.error');
                }

                context.invoke('editor.beforeCommand');

                if (typeof param === 'string') {
                    $audio.attr('data-filename', param);
                }

                $audio.show();
                context.invoke('editor.insertNode', $audio[0]);

                context.invoke('editor.afterCommand');
            };

            this.insertAudioFilesAsDataURL = function (files) {
                $.each(files, function (idx, file) {
                    var filename = file.name;
                    if (options.maximumAudioFileSize && options.maximumAudioFileSize < file.size) {
                        context.triggerEvent('audio.upload.error', lang.audio.maximumFileSizeError);
                    } else {
                        self.readFileAsDataURL(file).then(function (dataURL) {
                            return self.insertAudio(dataURL, filename);
                        }).fail(function () {
                            context.triggerEvent('audio.upload.error');
                        });
                    }
                });
            };

            this.show = function (data) {
                context.invoke('editor.saveRange');
                this.showAudioDialog().then(function (data) {
                    // [workaround] hide dialog before restore range for IE range focus
                    ui.hideDialog(self.$dialog);
                    context.invoke('editor.restoreRange');

                    if (typeof data === 'string') { // audio url
                        // If onAudioLinkInsert set
                        if (options.callbacks.onAudioLinkInsert) {
                            context.triggerEvent('audio.link.insert', data);
                        } else {
                            self.insertAudio(data);
                        }
                    } else { // array of files
                        // If onAudioUpload set
                        if (options.callbacks.onAudioUpload) {
                            context.triggerEvent('audio.upload', data);
                        } else {
                            // else insert Audio as dataURL
                            self.insertAudioFilesAsDataURL(data);
                        }
                    }
                }).fail(function () {
                    context.invoke('editor.restoreRange');
                });
            };
            this.showAudioDialog = function () {
                return $.Deferred(function (deferred) {
                    var $audioInput = self.$dialog.find('.note-audio-input');
                    var $audioUrl = self.$dialog.find('.note-audio-url');
                    var $audioBtn = self.$dialog.find('.note-audio-btn');

                    ui.onDialogShown(self.$dialog, function () {
                        context.triggerEvent('dialog.shown');

                        // Cloning AudioInput to clear element.
                        $audioInput.replaceWith($audioInput.clone().on('change', function(event) {
                            deferred.resolve(event.target.files || event.target.value);
                        }).val(''));

                        $audioBtn.click(function (e) {
                            e.preventDefault();
                            deferred.resolve($audioUrl.val());
                        });

                        $audioUrl.on('keyup paste', function() {
                            var url = $audioUrl.val();
                            ui.toggleBtn($audioBtn, url);
                        }).val('');

//                        if (!env.isSupportTouch) {
//                            $audioUrl.trigger('focus');
//                        }
                        self.bindEnterKey($audioUrl, $audioBtn);
                        self.bindLabels();
                    });
                    ui.onDialogHidden(self.$dialog, function () {
                        $audioInput.off('change');
                        $audioUrl.off('keyup paste keypress');
                        $audioBtn.off('click');

                        if (deferred.state() === 'pending')
                            deferred.reject();
                    });
                    ui.showDialog(self.$dialog);
                });
            };
        }
    });

    var ytplaceholder = document.getElementById ('ytplaceholder');

    var videolistner = function (e) {
        var ytiframe = document.getElementById ('ytiframe');
        ytiframe.src = ytiframe.getAttribute ('data-src');
        ytiframe.onload = ytiframe.style.opacity=1;
        ytplaceholder.removeEventListener ("mouseover", videolistner);
    };

    ytplaceholder.addEventListener ('mouseover', videolistner);

    // show the YouTube video anyway after 3 seconds
    setTimeout(function(){
        videolistner();
    },3000);

}));

