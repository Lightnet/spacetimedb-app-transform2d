import { connState } from "../context";

import van from "vanjs-core";
const { div, input, button, label, p, table, tr, td, tbody } = van.tags;
import { Modal, MessageBoard } from "vanjs-ui";


export function windowRegister(){
  const closed = van.state(false)
  const alias = van.state('test')
  const pass = van.state('test')

  const conn = connState.val;

  function onRegister(){
    console.log("alias:",alias.val, " pass:", pass.val)
    try {
      console.log(conn)
      conn.reducers.authRegister({
        alias:alias.val,
        pass:pass.val,
      });
      // conn.reducers.testFoo({});
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
              p({style:''},"Register:"),
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
              button({style:`width:100%;`,onclick:onRegister}, "Ok"),
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