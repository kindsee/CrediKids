from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

from .user import User
from .task import Task, TaskType, TaskFrequency, TaskStatus
from .task_assignment import TaskAssignment
from .task_completion import TaskCompletion
from .task_proposal import TaskProposal, ProposalStatus
from .reward import Reward
from .reward_redemption import RewardRedemption
from .icon import Icon
from .bonus import Bonus

__all__ = [
    'db',
    'User',
    'Task',
    'TaskType',
    'TaskFrequency',
    'TaskStatus',
    'TaskAssignment',
    'TaskCompletion',
    'TaskProposal',
    'ProposalStatus',
    'Reward',
    'RewardRedemption',
    'Icon',
    'Bonus'
]
