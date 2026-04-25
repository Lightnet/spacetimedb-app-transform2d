import { connState } from "../context";

import van from "vanjs-core";
const { div, input, button, label, p, table, tr, td, tbody } = van.tags;
import { Modal, MessageBoard } from "vanjs-ui";


export function windowLogin(){
  const closed = van.state(false);
  const alias = van.state('test');
  const pass = van.state('test');

  const conn = connState.val;

  function onLogin(){
    console.log("alias:",alias.val, " pass:", pass.val)
    try {
      console.log(conn)
      conn.reducers.authLogin({
        alias:alias.val,
        pass:pass.val,
      });
    } catch (error) {
      console.log("login error!")
    }
  }

  return Modal({closed},
    div({style: "display: flex; justify-content: center;"},
      table(
        tbody(
          tr(
            td({colspan:"2",style:`
              text-align: center;
              `},
              p({style:''},"Login:"),
            )
          ),
          tr(
            td(
              label('Alias:'),
            ),
            td(
              input({value:alias,oninput:e=>alias.val=e.target.value}),
            )
          ),
          tr(
            td(
              label('Pass:'),
            ),
            td(
              input({value:pass,oninput:e=>pass.val=e.target.value}),
            )
          ),
          tr(
            td({colspan:"2",style:``},
              button({style:`width:100%;`,onclick:onLogin}, "Ok"),
            )
          ),
          tr(
            td({colspan:"2",style:``},
              button({style:`width:100%;`,onclick: () => closed.val = true}, "Cancel"),
            )
          )
        )
      )
    ),
  )
}