import { Vector2 } from '../tools/vector2';
import { DataModel } from '../database/storage/data-model';
import { ForeignKey } from '../database/relational/foreign-key';
import { TeamcraftUser } from '../../model/user/teamcraft-user';
import { Aetheryte } from '../data/aetheryte';
import { AlarmGroup } from './alarm-group';
import { CompactMasterbook } from '../../model/common/compact-masterbook';

export class Alarm extends DataModel {

  @ForeignKey(TeamcraftUser)
  userId?: string;

  @ForeignKey(AlarmGroup)
  groupId?: string;

  itemId: number;
  icon: number;
  spawns: number[];
  duration: number;
  slot: number | string;
  zoneId: number;
  areaId: number;
  coords: Vector2;
  /**
   * Type of the node.
   * 0,1 = MIN
   * 2,3 = BOT
   * 4 = FSH (Spearfishing)
   */
  type: number;

  groupName: string;

  note: string;

  aetheryte: Aetheryte;

  folklore?: CompactMasterbook;

  constructor(alarmData?: Partial<Alarm>) {
    super();
    if (alarmData) {
      Object.assign(this, alarmData);
    }
  }
}