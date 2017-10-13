/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import coerceKeyPath from '../utils/coerceKeyPath';
import { NOT_SET } from '../TrieUtils';
import { emptyMap } from '../Map';
import { get } from './get';
import { remove } from './remove';
import { set } from './set';

export function updateIn(collection, keyPath, notSetValue, updater) {
  if (!updater) {
    updater = notSetValue;
    notSetValue = undefined;
  }
  const updatedValue = updateInDeeply(
    collection,
    coerceKeyPath(keyPath),
    0,
    notSetValue,
    updater
  );
  return updatedValue === NOT_SET ? notSetValue : updatedValue;
}

function updateInDeeply(existing, keyPath, i, notSetValue, updater) {
  const wasNotSet = existing === NOT_SET;
  if (i === keyPath.length) {
    const existingValue = wasNotSet ? notSetValue : existing;
    const newValue = updater(existingValue);
    return newValue === existingValue ? existing : newValue;
  }
  // if (!(wasNotSet || (existing && existing.set))) {
  //   throw new TypeError(
  //     'Invalid keyPath: Value at [' +
  //       keyPath.slice(0, i).map(quoteString) +
  //       '] does not have a .set() method and cannot be updated: ' +
  //       existing
  //   );
  // }
  const key = keyPath[i];
  const nextExisting = wasNotSet ? NOT_SET : get(existing, key, NOT_SET);
  const nextUpdated = updateInDeeply(
    nextExisting,
    keyPath,
    i + 1,
    notSetValue,
    updater
  );
  return nextUpdated === nextExisting
    ? existing
    : nextUpdated === NOT_SET
      ? remove(existing, key)
      : set(wasNotSet ? emptyMap() : existing, key, nextUpdated);
}
