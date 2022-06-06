import { bool } from "aws-sdk/clients/signer";
import {
  Column,
  Table,
  BelongsTo,
  ForeignKey,
  NotEmpty,
  DataType,
  IsUrl,
} from "sequelize-typescript";
import { Event } from "@server/types";
import Team from "./Team";
import User from "./User";
import IdModel from "./base/IdModel";
import Encrypted, {
  getEncryptedColumn,
  setEncryptedColumn,
} from "./decorators/Encrypted";
import Fix from "./decorators/Fix";

@Table({
  tableName: "webhook_subscriptions",
  modelName: "webhook_subscription",
})
@Fix
class WebhookSubscription extends IdModel {
  @NotEmpty
  @Column
  name: string;

  @IsUrl
  @NotEmpty
  @Column
  url: string;

  @Column
  enabled: boolean;

  @Column(DataType.ARRAY(DataType.STRING))
  events: string[];

  @Column(DataType.BLOB)
  @Encrypted
  get secret() {
    return getEncryptedColumn(this, "secret");
  }

  set secret(value: string) {
    setEncryptedColumn(this, "secret", value);
  }

  // associations

  @BelongsTo(() => User, "createdById")
  createdBy: User;

  @ForeignKey(() => User)
  @Column
  createdById: string;

  @BelongsTo(() => Team, "teamId")
  team: Team;

  @ForeignKey(() => Team)
  @Column
  teamId: string;

  // methods
  validForEvent = (event: Event): bool => {
    if (this.events === ["*"]) {
      return true;
    }

    for (const e of this.events) {
      if (e === event.name || event.name.startsWith(e + ".")) {
        return true;
      }
    }

    return false;
  };
}

export default WebhookSubscription;
