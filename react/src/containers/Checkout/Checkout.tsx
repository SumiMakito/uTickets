import React, { useEffect, useState, useRef, SyntheticEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { Button, Modal, Input } from "semantic-ui-react";
import { expandTicketInfo } from "../../models/tickets";
import CardFlow from "../../components/CardFlow/CardFlow";
import TicketForm from "../../components/TicketForm/TicketForm";
import TicketList from "../../components/TicketList/TicketList";
import { FORM_RESET_ACTION } from "../../redux/actions/form";
import { RootState } from "../../redux/reducers";
import { postOrder } from "../../services/order";
import "./Checkout.scss";

const Checkout: React.FC = () => {
  const [isBackModalVisible, setIsBackModalVisible] = useState(false);
  const [
    isOrderSubmittedModalVisible,
    setsOrderSubmittedModalVisible,
  ] = useState(false);
  const [orderInfoEmail, setOrderInfoEmail] = useState("");

  const history = useHistory();
  const { tickets } = useSelector((state: RootState) => state.tickets);
  const selection = useSelector((state: RootState) => state.cart.tickets);
  const ticketInfo = useSelector((state: RootState) => state.form.forms);
  const isLoading = useSelector((state: RootState) => state.order.isLoading);
  const dispatch = useDispatch();
  const formRef = useRef(null);

  const onUnload = (evt: BeforeUnloadEvent) => {
    evt.returnValue = "请注意，当前填写的购票信息将不会被保存。";
  };

  useEffect(() => {
    window.addEventListener("beforeunload", onUnload);
    dispatch({
      type: FORM_RESET_ACTION,
      newTicketInfo: expandTicketInfo(tickets, selection),
    });
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [tickets, selection, dispatch]);

  if (!selection.size) history.push("/");

  const reportAllValidity = () => {
    if (!formRef || !formRef.current) return false;
    return (formRef.current! as HTMLFormElement).reportValidity();
  };

  const checkTicketInfoValidity = () => {
    if (!reportAllValidity()) return false;
    for (let i = 0; i < ticketInfo.length; i++) {
      const { data } = ticketInfo[i];
      const { infoFormItems } = ticketInfo[i].ticket;
      for (let j = 0; j < infoFormItems.length; j++) {
        if (!infoFormItems[j].optional && !(infoFormItems[j].name in data))
          return false;
      }
    }
    return true;
  };

  const submitOrder = () => {
    checkTicketInfoValidity();
    postOrder({
      email: orderInfoEmail,
      tickets: ticketInfo.map((info) => ({
        type: info.ticket.type,
        data: info.data,
      })),
    }).then(({ data }) => {
      if (data.result === "ok") {
        setsOrderSubmittedModalVisible(true);
      }
    });
  };

  return (
    <React.Fragment>
      <div className="Checkout">
        <CardFlow noHeader>
          <div className="nav">
            <Button
              content="返回"
              onClick={() => setIsBackModalVisible(true)}
            />
          </div>
          <div className="title">请确认您选择的票种</div>
          <TicketList
            tickets={tickets.filter((t) => !!selection.get(t))}
            readonly
          />
          <div>
            <form ref={formRef}>
              {ticketInfo.map((info) => (
                <TicketForm key={info.uuid} ticketInfo={info} />
              ))}
              <div className="orderInfoForm">
                <div className="groupTitle">购票人信息</div>
                <div className="inputGroup">
                  <div className="inputContainer">
                    <Input
                      label="电子邮箱"
                      type="email"
                      title="电子邮箱地址"
                      placeholder="订单信息将被发送至您提供的邮箱"
                      value={orderInfoEmail}
                      onChange={(evt: SyntheticEvent) =>
                        setOrderInfoEmail(
                          (evt.target as HTMLInputElement).value
                        )
                      }
                      required
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div className="checkoutFooter">
            <div className="checkoutFooterLeft"></div>
            <div className="checkoutFooterRight">
              <Button
                primary
                onClick={() => submitOrder()}
                disabled={isLoading}
              >
                {isLoading ? "处理中" : "继续"}
              </Button>
            </div>
          </div>
        </CardFlow>
      </div>
      <Modal
        size="mini"
        open={isBackModalVisible}
        onClose={() => setIsBackModalVisible(false)}
      >
        <Modal.Header>返回上一步？</Modal.Header>
        <Modal.Content>
          <p>请注意，当前填写的购票信息将不会被保存。</p>
        </Modal.Content>
        <Modal.Actions>
          <Button negative onClick={() => history.push("/")}>
            返回
          </Button>
          <Button
            positive
            content="继续填写"
            onClick={() => setIsBackModalVisible(false)}
          />
        </Modal.Actions>
      </Modal>
      <Modal
        size="mini"
        open={isOrderSubmittedModalVisible}
        onClose={() => {
          setsOrderSubmittedModalVisible(false);
          history.push("/");
        }}
      >
        <Modal.Header>订单提交成功</Modal.Header>
        <Modal.Content>
          <p>
            您的订单已提交成功，请注意查收订单邮件并根据邮件内提示完成支付。
          </p>
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={() => history.push("/")}>继续</Button>
        </Modal.Actions>
      </Modal>
    </React.Fragment>
  );
};

export default Checkout;
