import BilingualText from './BilingualText'
import { SHIPMENT_BALANCE } from '../data/balance'
import type { ShipmentOption } from '../data/balance'
import type { PendingShipment } from '../types'
import { text } from '../translations'

type CrudeShipmentsPanelProps = {
  money: number
  pendingShipments: PendingShipment[]
  tickCount: number
  onOrder: (option: ShipmentOption) => void
}

function secondsRemaining(arrivesAt: number) {
  return Math.max(0, Math.ceil((arrivesAt - Date.now()) / 1000))
}

function CrudeShipmentsPanel({
  money,
  pendingShipments,
  onOrder,
}: CrudeShipmentsPanelProps) {
  return (
    <section className="panel shipments-panel">
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">
            <BilingualText text={text.shipments.kicker} />
          </p>
          <h2>
            <BilingualText text={text.shipments.title} />
          </h2>
        </div>
      </div>

      <div className="shipment-options">
        {SHIPMENT_BALANCE.map((option) => {
          const canAfford = money >= option.cost
          const delaySecs = option.delayMs / 1000
          const name = text.shipments.names[option.key]

          return (
            <div key={option.key} className="shipment-option-card">
              <div className="shipment-option-info">
                <strong className="shipment-option-name">
                  <BilingualText text={name} />
                </strong>
                <span className="shipment-option-meta">
                  <BilingualText text={text.shipments.amount(option.amount)} />
                  {' · '}
                  <BilingualText text={text.shipments.cost(option.cost)} />
                  {' · '}
                  <BilingualText text={text.shipments.delaySecs(delaySecs)} />
                </span>
              </div>
              <button
                type="button"
                className="action-button"
                disabled={!canAfford}
                onClick={() => onOrder(option)}
              >
                <BilingualText text={text.shipments.orderButton} />
              </button>
            </div>
          )
        })}
      </div>

      {pendingShipments.length > 0 && (
        <div className="pending-shipments">
          <p className="pending-shipments-label">
            <BilingualText text={text.shipments.pendingTitle} />
          </p>
          <ul className="pending-shipments-list">
            {pendingShipments.map((shipment) => {
              const secs = secondsRemaining(shipment.arrivesAt)
              return (
                <li key={shipment.id} className="pending-shipment-item">
                  <span className="pending-shipment-amount">
                    <BilingualText text={text.shipments.amount(shipment.amount)} />
                  </span>
                  <span className="pending-shipment-countdown">
                    <BilingualText text={text.shipments.countdown(secs)} />
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}

export default CrudeShipmentsPanel
