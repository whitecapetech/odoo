/** @odoo-module **/

import { _t } from "@web/core/l10n/translation";
import {
    registerBackendAndFrontendTour,
} from '@website/js/tours/tour_utils';

registerBackendAndFrontendTour("question", {
    url: '/forum/1',
}, () => [{
    trigger: ".o_wforum_ask_btn",
    tooltipPosition: "left",
    content: _t("Create a new post in this forum by clicking on the button."),
    run: "click",
}, {
    trigger: "input[name=post_name]",
    tooltipPosition: "top",
    content: _t("Give your post title."),
    run: "edit Test",
},
{
    isActive: ["auto"],
    trigger: `input[name=post_name]:not(:empty)`,
},
{
    trigger: ".note-editable p",
    content: _t("Put your question here."),
    tooltipPosition: "bottom",
    run: "editor Test",
},
{
    isActive: ["auto"],
    trigger: `.note-editable p:not(:contains(/^<br>$/))`,
},
{
    trigger: ".select2-choices",
    content: _t("Insert tags related to your question."),
    tooltipPosition: "top",
}, 
{
    trigger: "input[id=s2id_autogen2]",
    run: "edit Test",
},
{
    isActive: ["auto"],
    trigger: `input[id=s2id_autogen2]:not(:contains(Tags))`,
},
{
    trigger: "button:contains(/^Post/)",
    content: _t("Click to post your question."),
    tooltipPosition: "bottom",
    run: "click",
}, {
    isActive: ["auto"],
    trigger: ".modal .modal-header button.btn-close",
    run: "click",
},
{
    trigger: "a:contains(\"Reply\").collapsed",
    content: _t("Click to reply."),
    tooltipPosition: "bottom",
    run: "click",
},
{
    trigger: ".note-editable p",
    content: _t("Put your answer here."),
    tooltipPosition: "bottom",
    run: "editor Test",
},
{
    isActive: ["auto"],
    trigger: `.note-editable p:not(:contains(/^<br>$/))`,
},
{
    trigger: "button:contains(\"Post Answer\")",
    content: _t("Click to post your answer."),
    tooltipPosition: "bottom",
    run: "click",
}, {
    isActive: ["auto"],
    trigger: ".modal .modal-header button.btn-close",
    run: "click",
}, {
    trigger: ".o_wforum_validate_toggler[data-karma]:first",
    content: _t("Click here to accept this answer."),
    tooltipPosition: "right",
    run: "click",
}, {
    isActive: ["auto"],
    content: "Check edit button is there",
    trigger: "a:contains('Edit your answer')",
}]);
