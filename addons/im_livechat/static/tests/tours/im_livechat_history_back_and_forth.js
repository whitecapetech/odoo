import { delay } from "@odoo/hoot-dom";
import { registry } from "@web/core/registry";

registry.category("web_tour.tours").add("im_livechat_history_back_and_forth_tour", {
    steps: () => [
        {
            isActive: ["enterprise"],
            content: "open command palette",
            trigger: ".o_home_menu",
            run: "click && press ctrl+k",
        },
        {
            isActive: ["community"],
            content: "open command palette",
            trigger: "body:has(.o_action_manager)",
            run: "press ctrl+k",
        },
        {
            trigger: ".o_command_palette_search input",
            run: "fill /",
        },
        {
            trigger: ".o_command_palette_search input",
            run: "fill Live Chat",
        },
        {
            trigger: ".o_command:contains(Sessions)",
            run: "click",
        },
        {
            trigger: "button.o_switch_view.o_list",
            run: "click",
        },
        {
            trigger: ".o_data_cell:contains(Visitor)",
            run: "click",
        },
        {
            trigger: ".o-mail-Discuss-threadName[title='Visitor']",
            async run() {
                await delay(1000);
                history.back();
            },
        },
        {
            trigger: ".o_data_cell:contains(Visitor)",
            async run() {
                await delay(0);
                history.forward();
            },
        },
        {
            trigger: ".o-mail-Discuss-threadName[title='Visitor']",
            async run() {
                await delay(1000);
                history.back();
            },
        },
        {
            trigger: ".o_data_cell:contains(Visitor)",
        },
    ],
});
