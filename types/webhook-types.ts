export interface DeliveryAddress {
    city: string;
    street: string;
    house: string;
    flat: string;
    entrance: string;
    intercom: string;
    comment: string;
}

export interface ClientInfo {
    name: string;
    phone: string;
}

export interface WebhookBody {
  orderId: string;
  status: string;
  paid: boolean;
  leaveAtTheDoor: boolean;
  deliveryAddress: DeliveryAddress;
  clientInfo: ClientInfo;
}